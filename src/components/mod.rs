use crate::utils::format_phone;
use yew::{function_component, html, Children, Properties};

pub mod buttons;
pub mod complex;
pub mod confirm_account;
pub mod delete_modal;
pub mod error_box;
pub mod forms;
pub mod list;
pub mod navbar;
pub mod table;

#[function_component(Spinner)]
fn spinner() -> Html {
    html! {
        <div class="spinner">
            <div class="spinner-inner">
                <i class="oldgold-text fas fa-circle-notch fa-2x fa-spin" />
            </div>
        </div>
    }
}

pub enum TooltipType {
    Left,
    Right,
    Multiline,
}

#[derive(Properties, PartialEq)]
pub struct TooltipProps {
    content: String,
    #[prop_or_default]
    r#type: Option<TooltipType>,
    #[prop_or_default]
    pub children: Children,
}

#[function_component(Tooltip)]
fn tooltip(props: &TooltipProps) -> Html {
    let class = if let Some(r#type) = props.r#type {
        let tooltip_type = match r#type {
            TooltipType::Left => "left",
            TooltipType::Right => "right",
            TooltipType::Multiline => "multiline",
        };

        format!("tooltip is-tooltip {tooltip_type}")
    } else {
        "tooltip is-tooltip".to_owned()
    };

    html! {
        <span style="cursor: pointer" data-tooltip={props.content} class={class}>
            { props.children }
        </span>
    }
}

#[derive(Properties, PartialEq)]
pub struct CheckOrCrossProps {
    pub checked: bool,
}

#[function_component(CheckOrCross)]
fn check_or_cross(props: &CheckOrCrossProps) -> Html {
    let class = format!(
        "fas fa-lg fa-{}",
        if props.checked { "check" } else { "times" }
    );

    html! {
        <span class="icon is-medium">
            <i class={class} />
        </span>
    }
}

#[derive(Properties, PartialEq)]
pub struct EmailLinkProps {
    pub email: String,
}

#[function_component(EmailLink)]
fn email_link(props: &EmailLinkProps) -> Html {
    html! {
        <a href={"mailto:" + props.email}>
            {props.email}
        </a>
    }
}

#[derive(Properties, PartialEq)]
pub struct PhoneLinkProps {
    pub phone: String,
}

#[function_component(PhoneLink)]
fn phone_link(props: &PhoneLinkProps) -> Html {
    html! {
        <a href={"tel:" + props.phone}>
            {format_phone(&props.phone)}
        </a>
    }
}
