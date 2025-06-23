use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use csv::ReaderBuilder;
use serde_json;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ImportedPassword {
    pub site: String,
    pub username: String,
    pub password: String,
    pub notes: Option<String>,
    pub url: Option<String>,
    pub folder: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImportResult {
    pub success: bool,
    pub imported: usize,
    pub skipped: usize,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
    pub duplicates: Vec<ImportedPassword>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImportOptions {
    pub skip_duplicates: bool,
    pub update_existing: bool,
    pub validate_urls: bool,
    pub import_notes: bool,
}

// Parseur générique pour CSV
pub fn parse_csv_content(content: &str, source: &str) -> Result<Vec<ImportedPassword>, String> {
    let mut passwords = Vec::new();
    let mut reader = ReaderBuilder::new()
        .has_headers(true)
        .from_reader(content.as_bytes());

    // Récupérer les headers pour identifier le format
    let headers = reader.headers()
        .map_err(|e| format!("Erreur lecture headers: {}", e))?
        .clone();

    for result in reader.records() {
        let record = result.map_err(|e| format!("Erreur lecture ligne: {}", e))?;
        
        match source {
            "lastpass" => {
                if let Some(password) = parse_lastpass_record(&headers, &record) {
                    passwords.push(password);
                }
            },
            "chrome" => {
                if let Some(password) = parse_chrome_record(&headers, &record) {
                    passwords.push(password);
                }
            },
            "firefox" => {
                if let Some(password) = parse_firefox_record(&headers, &record) {
                    passwords.push(password);
                }
            },
            "bitwarden" => {
                if let Some(password) = parse_bitwarden_csv_record(&headers, &record) {
                    passwords.push(password);
                }
            },
            _ => {
                // Format générique CSV
                if let Some(password) = parse_generic_csv_record(&headers, &record) {
                    passwords.push(password);
                }
            }
        }
    }

    Ok(passwords)
}

// Parseur spécifique LastPass
fn parse_lastpass_record(headers: &csv::StringRecord, record: &csv::StringRecord) -> Option<ImportedPassword> {
    let header_map: HashMap<String, usize> = headers
        .iter()
        .enumerate()
        .map(|(i, h)| (h.to_lowercase(), i))
        .collect();

    let site = get_field_value(&header_map, record, &["name", "title", "site"])?;
    let username = get_field_value(&header_map, record, &["username", "login", "email"])?;
    let password = get_field_value(&header_map, record, &["password", "pass"])?;
    let url = get_field_value(&header_map, record, &["url", "website", "link"]);
    let notes = get_field_value(&header_map, record, &["notes", "note", "comment"]);
    let folder = get_field_value(&header_map, record, &["folder", "group", "category"]);

    Some(ImportedPassword {
        site,
        username,
        password,
        url,
        notes,
        folder,
    })
}

// Parseur spécifique Chrome
fn parse_chrome_record(headers: &csv::StringRecord, record: &csv::StringRecord) -> Option<ImportedPassword> {
    let header_map: HashMap<String, usize> = headers
        .iter()
        .enumerate()
        .map(|(i, h)| (h.to_lowercase(), i))
        .collect();

    let site = get_field_value(&header_map, record, &["name", "title", "url"])?;
    let username = get_field_value(&header_map, record, &["username", "login"])?;
    let password = get_field_value(&header_map, record, &["password"])?;
    let url = get_field_value(&header_map, record, &["url", "website"]);

    Some(ImportedPassword {
        site: extract_domain_from_url(&site).unwrap_or(site),
        username,
        password,
        url,
        notes: None,
        folder: None,
    })
}

// Parseur spécifique Firefox
fn parse_firefox_record(headers: &csv::StringRecord, record: &csv::StringRecord) -> Option<ImportedPassword> {
    let header_map: HashMap<String, usize> = headers
        .iter()
        .enumerate()
        .map(|(i, h)| (h.to_lowercase(), i))
        .collect();

    let url = get_field_value(&header_map, record, &["url", "hostname"])?;
    let username = get_field_value(&header_map, record, &["username", "login"])?;
    let password = get_field_value(&header_map, record, &["password"])?;
    let site = extract_domain_from_url(&url).unwrap_or(url.clone());

    Some(ImportedPassword {
        site,
        username,
        password,
        url: Some(url),
        notes: None,
        folder: None,
    })
}

// Parseur spécifique Bitwarden CSV
fn parse_bitwarden_csv_record(headers: &csv::StringRecord, record: &csv::StringRecord) -> Option<ImportedPassword> {
    let header_map: HashMap<String, usize> = headers
        .iter()
        .enumerate()
        .map(|(i, h)| (h.to_lowercase(), i))
        .collect();

    let site = get_field_value(&header_map, record, &["name", "title"])?;
    let username = get_field_value(&header_map, record, &["username", "login_username"])?;
    let password = get_field_value(&header_map, record, &["password", "login_password"])?;
    let url = get_field_value(&header_map, record, &["login_uri", "url"]);
    let notes = get_field_value(&header_map, record, &["notes"]);
    let folder = get_field_value(&header_map, record, &["folder"]);

    Some(ImportedPassword {
        site,
        username,
        password,
        url,
        notes,
        folder,
    })
}

// Parseur générique CSV
fn parse_generic_csv_record(headers: &csv::StringRecord, record: &csv::StringRecord) -> Option<ImportedPassword> {
    let header_map: HashMap<String, usize> = headers
        .iter()
        .enumerate()
        .map(|(i, h)| (h.to_lowercase(), i))
        .collect();

    let site = get_field_value(&header_map, record, &["site", "name", "title", "service", "domain"])?;
    let username = get_field_value(&header_map, record, &["username", "user", "login", "email"])?;
    let password = get_field_value(&header_map, record, &["password", "pass", "pwd"])?;
    let url = get_field_value(&header_map, record, &["url", "website", "link"]);
    let notes = get_field_value(&header_map, record, &["notes", "note", "comment", "description"]);

    Some(ImportedPassword {
        site,
        username,
        password,
        url,
        notes,
        folder: None,
    })
}

// Parseur JSON pour Bitwarden
pub fn parse_bitwarden_json(content: &str) -> Result<Vec<ImportedPassword>, String> {
    let json_data: serde_json::Value = serde_json::from_str(content)
        .map_err(|e| format!("JSON invalide: {}", e))?;

    let mut passwords = Vec::new();

    if let Some(items) = json_data.get("items").and_then(|v| v.as_array()) {
        for item in items {
            if let Some(login) = item.get("login") {
                let site = item.get("name")
                    .and_then(|v| v.as_str())
                    .unwrap_or("Site inconnu")
                    .to_string();

                let username = login.get("username")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();

                let password = login.get("password")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();

                let url = login.get("uris")
                    .and_then(|v| v.as_array())
                    .and_then(|arr| arr.first())
                    .and_then(|uri| uri.get("uri"))
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());

                let notes = item.get("notes")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());

                let folder = item.get("folderId")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());

                if !username.is_empty() && !password.is_empty() {
                    passwords.push(ImportedPassword {
                        site,
                        username,
                        password,
                        url,
                        notes,
                        folder,
                    });
                }
            }
        }
    }

    Ok(passwords)
}

// Fonctions utilitaires
fn get_field_value(
    header_map: &HashMap<String, usize>,
    record: &csv::StringRecord,
    field_names: &[&str],
) -> Option<String> {
    for field_name in field_names {
        if let Some(&index) = header_map.get(&field_name.to_lowercase()) {
            if let Some(value) = record.get(index) {
                let trimmed = value.trim();
                if !trimmed.is_empty() {
                    return Some(trimmed.to_string());
                }
            }
        }
    }
    None
}

fn extract_domain_from_url(url: &str) -> Option<String> {
    if let Ok(parsed_url) = url::Url::parse(url) {
        if let Some(host) = parsed_url.host_str() {
            return Some(host.to_string());
        }
    }
    
    // Fallback pour les URLs mal formées
    if url.contains("://") {
        let parts: Vec<&str> = url.split("://").collect();
        if parts.len() > 1 {
            let domain_part = parts[1].split('/').next().unwrap_or("");
            if !domain_part.is_empty() {
                return Some(domain_part.to_string());
            }
        }
    }
    
    None
}

// Validation des mots de passe importés
pub fn validate_imported_passwords(passwords: &[ImportedPassword]) -> Vec<String> {
    let mut warnings = Vec::new();
    
    for (index, password) in passwords.iter().enumerate() {
        // Vérifier les champs requis
        if password.site.trim().is_empty() {
            warnings.push(format!("Ligne {}: Site manquant", index + 1));
        }
        
        if password.username.trim().is_empty() {
            warnings.push(format!("Ligne {}: Nom d'utilisateur manquant", index + 1));
        }
        
        if password.password.trim().is_empty() {
            warnings.push(format!("Ligne {}: Mot de passe manquant", index + 1));
        }
        
        // Vérifier la force du mot de passe
        if password.password.len() < 8 {
            warnings.push(format!("Ligne {}: Mot de passe faible (< 8 caractères)", index + 1));
        }
        
        // Vérifier la validité de l'URL si présente
        if let Some(url_str) = &password.url {
            if !url_str.is_empty() && url::Url::parse(url_str).is_err() {
                warnings.push(format!("Ligne {}: URL invalide: {}", index + 1, url_str));
            }
        }
    }
    
    warnings
}

// Détection des doublons
pub fn find_duplicates(passwords: &[ImportedPassword]) -> Vec<(usize, usize)> {
    let mut duplicates = Vec::new();
    
    for (i, password1) in passwords.iter().enumerate() {
        for (j, password2) in passwords.iter().enumerate().skip(i + 1) {
            if password1.site.to_lowercase() == password2.site.to_lowercase() &&
               password1.username.to_lowercase() == password2.username.to_lowercase() {
                duplicates.push((i, j));
            }
        }
    }
    
    duplicates
} 