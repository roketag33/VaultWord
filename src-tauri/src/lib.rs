// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Deserialize, Serialize};
use rand::Rng;
use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier, password_hash::{rand_core::OsRng, SaltString}};

mod import_export;
use import_export::*;

#[derive(Debug, Serialize, Deserialize)]
pub struct PasswordGeneratorOptions {
    pub length: u32,
    pub include_uppercase: bool,
    pub include_lowercase: bool,
    pub include_numbers: bool,
    pub include_symbols: bool,
}

#[tauri::command]
async fn generate_password(options: PasswordGeneratorOptions) -> Result<String, String> {
    let mut characters = String::new();
    
    if options.include_lowercase {
        characters.push_str("abcdefghijklmnopqrstuvwxyz");
    }
    if options.include_uppercase {
        characters.push_str("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    }
    if options.include_numbers {
        characters.push_str("0123456789");
    }
    if options.include_symbols {
        characters.push_str("!@#$%^&*()_+-=[]{}|;:,.<>?");
    }
    
    if characters.is_empty() {
        return Err("Au moins un type de caractère doit être sélectionné".to_string());
    }
    
    let mut rng = rand::thread_rng();
    let chars: Vec<char> = characters.chars().collect();
    let password: String = (0..options.length)
        .map(|_| chars[rng.gen_range(0..chars.len())])
        .collect();
    
    Ok(password)
}

#[tauri::command]
async fn hash_password(password: String) -> Result<String, String> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    
    match argon2.hash_password(password.as_bytes(), &salt) {
        Ok(hash) => Ok(hash.to_string()),
        Err(e) => Err(format!("Erreur lors du hachage: {}", e)),
    }
}

#[tauri::command]
async fn verify_password(password: String, hash: String) -> Result<bool, String> {
    let argon2 = Argon2::default();
    let parsed_hash = match PasswordHash::new(&hash) {
        Ok(h) => h,
        Err(e) => return Err(format!("Hash invalide: {}", e)),
    };
    
    Ok(argon2.verify_password(password.as_bytes(), &parsed_hash).is_ok())
}

// Commandes d'import/export
#[tauri::command]
async fn parse_import_file(content: String, source: String, file_extension: String) -> Result<Vec<ImportedPassword>, String> {
    match file_extension.to_lowercase().as_str() {
        "csv" => parse_csv_content(&content, &source),
        "json" => {
            if source == "bitwarden" {
                parse_bitwarden_json(&content)
            } else {
                Err("Format JSON non supporté pour cette source".to_string())
            }
        },
        _ => Err(format!("Extension de fichier non supportée: {}", file_extension))
    }
}

#[tauri::command]
async fn validate_import_data(passwords: Vec<ImportedPassword>) -> Result<Vec<String>, String> {
    Ok(validate_imported_passwords(&passwords))
}

#[tauri::command]
async fn find_import_duplicates(passwords: Vec<ImportedPassword>) -> Result<Vec<(usize, usize)>, String> {
    Ok(find_duplicates(&passwords))
}

#[tauri::command]
async fn export_passwords_csv(passwords: Vec<ImportedPassword>, include_metadata: bool) -> Result<String, String> {
    let mut csv_content = String::new();
    
    // Headers
    if include_metadata {
        csv_content.push_str("site,username,password,url,notes,folder\n");
    } else {
        csv_content.push_str("site,username,password\n");
    }
    
    // Data
    for password in passwords {
        let site = escape_csv_field(&password.site);
        let username = escape_csv_field(&password.username);
        let password_field = escape_csv_field(&password.password);
        
        if include_metadata {
            let url = escape_csv_field(&password.url.unwrap_or_default());
            let notes = escape_csv_field(&password.notes.unwrap_or_default());
            let folder = escape_csv_field(&password.folder.unwrap_or_default());
            csv_content.push_str(&format!("{},{},{},{},{},{}\n", site, username, password_field, url, notes, folder));
        } else {
            csv_content.push_str(&format!("{},{},{}\n", site, username, password_field));
        }
    }
    
    Ok(csv_content)
}

#[tauri::command]
async fn export_passwords_json(passwords: Vec<ImportedPassword>) -> Result<String, String> {
    match serde_json::to_string_pretty(&passwords) {
        Ok(json) => Ok(json),
        Err(e) => Err(format!("Erreur lors de la sérialisation JSON: {}", e))
    }
}

#[tauri::command]
async fn save_export_file(app_handle: tauri::AppHandle, content: String, filename: String) -> Result<String, String> {
    use tauri_plugin_dialog::DialogExt;
    
    // Ouvrir une boîte de dialogue pour choisir où sauvegarder
    let file_path = app_handle
        .dialog()
        .file()
        .set_file_name(&filename)
        .blocking_save_file();
    
    match file_path {
        Some(path) => {
            // Convertir FilePath en PathBuf
            let path_buf = path.as_path().unwrap();
            
            // Écrire le contenu dans le fichier
            match std::fs::write(&path_buf, content) {
                Ok(_) => Ok(path_buf.to_string_lossy().to_string()),
                Err(e) => Err(format!("Erreur lors de l'écriture du fichier: {}", e))
            }
        },
        None => Err("Sauvegarde annulée par l'utilisateur".to_string())
    }
}

// Fonction utilitaire pour échapper les champs CSV
fn escape_csv_field(field: &str) -> String {
    if field.contains(',') || field.contains('"') || field.contains('\n') {
        format!("\"{}\"", field.replace('"', "\"\""))
    } else {
        field.to_string()
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            generate_password,
            hash_password,
            verify_password,
            parse_import_file,
            validate_import_data,
            find_import_duplicates,
            export_passwords_csv,
            export_passwords_json,
            save_export_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
