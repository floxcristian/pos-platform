/// Desktop host only. Payments, printing and synchronization remain mock adapters.
/// No native commands or device plugins are exposed by this prototype.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("No se pudo iniciar Corporate POS");
}
