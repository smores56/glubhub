#![allow(non_snake_case)]
#![feature(proc_macro_hygiene, async_closure)]

use dioxus::prelude::*;

pub mod constants;
pub mod error;
pub mod fragments;
pub mod page;
pub mod permissions;
pub mod query;
pub mod route;
pub mod token;
pub mod types;
pub mod utils;

#[cynic::schema_for_derives(file = "../schema.graphql", module = "crate::query::schema")]
pub mod queries;

fn App(cx: Scope) -> Element {
    cx.render(rsx!(
        h1 { "Hello World" }
    ))
}

fn main() {
    dioxus::web::launch(App);
}
