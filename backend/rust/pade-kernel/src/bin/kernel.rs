use pade_kernel::{evaluate_admission, AdmissionInput};
use std::io::{self, Read, Write};

fn main() {
    let mut raw = String::new();
    if io::stdin().read_to_string(&mut raw).is_err() {
        std::process::exit(2);
    }
    let input: AdmissionInput = match serde_json::from_str(&raw) {
        Ok(input) => input,
        Err(error) => {
            eprintln!("{error}");
            std::process::exit(2);
        }
    };
    match evaluate_admission(&input) {
        Ok(decision) => {
            let encoded = serde_json::to_vec(&decision).expect("decision encodes");
            let _ = io::stdout().write_all(&encoded);
        }
        Err(error) => {
            eprintln!("{error}");
            std::process::exit(2);
        }
    }
}
