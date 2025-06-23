// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Deserialize, Serialize};
use rand::Rng;
use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier, password_hash::{rand_core::OsRng, SaltString}};

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            generate_password,
            hash_password,
            verify_password,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
