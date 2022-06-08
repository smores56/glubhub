use yew::prelude::*;

pub mod classes;
pub mod components;
pub mod constants;
pub mod error;
pub mod fragments;
pub mod page;
pub mod permissions;
pub mod queries;
pub mod query;
pub mod route;
pub mod types;
pub mod utils;

#[function_component(App)]
fn app() -> Html {
    html! {
        <h1>{ "Hello World" }</h1>
    }
}

fn main() {
    yew::start_app::<App>();
}
