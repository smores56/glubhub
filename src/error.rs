use thiserror::Error;

#[derive(Error, Debug)]
pub enum GlubhubError {
    #[error("Network error occurred: {0}")]
    NetworkError(#[from] reqwasm::Error),
    #[error("{0}")]
    Other(String),
}

pub type GlubhubResult<T> = Result<T, GlubhubError>;
