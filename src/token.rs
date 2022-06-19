use web_sys::{window, Storage};

use crate::constants::{GREASE_OLD_TOKEN_NAME, GREASE_TOKEN_NAME};

fn get_storage() -> Option<Storage> {
    window()?.local_storage().ok()?
}

pub fn get_token() -> Option<String> {
    let storage = get_storage()?;

    storage.get_item(GREASE_TOKEN_NAME)
}

pub fn set_token(token: &str) {
    let storage = get_storage()?;

    storage.set_item(GREASE_TOKEN_NAME, token).ok();
}

pub fn unset_token() {
    let storage = get_storage()?;

    storage.remove_item(GREASE_TOKEN_NAME).ok();
}

pub fn get_old_token() -> Option<String> {
    let storage = get_storage()?;

    storage.get_item(GREASE_OLD_TOKEN_NAME)
}

pub fn set_old_token(token: &str) {
    let storage = get_storage()?;

    storage.set_item(GREASE_OLD_TOKEN_NAME, token).ok();
}

pub fn unset_old_token() {
    let storage = get_storage()?;

    storage.remove_item(GREASE_OLD_TOKEN_NAME).ok();
}
