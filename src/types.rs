pub struct GlubHubContext {
    user: Option<Member>,
    members: Vec<Member>,
    info: StaticData,
    current_semester: Semester,
}

pub enum SubmissionState {
    NotSentYet,
    Sending,
    Error(GlubhubError),
}

pub enum RemoteData<T> {
    NotAsked,
    Loading,
    Loaded(T),
    Error(GlubhubError),
}

impl<T> RemoteData<T> {
    pub fn map_loaded<U>(self, map: impl FnMut(T) -> U) -> RemoteData<U> {
        match self {
            RemoteData::NotAsked => RemoteData::NotAsked,
            RemoteData::Loading => RemoteData::Loading,
            RemoteData::Loaded(data) => RemoteData::Loaded(map(data)),
            RemoteData::Error(error) => RemoteData::Error(error),
        }
    }
}

impl<T> From<GlubhubResult<T>> for RemoteData<T> {
    fn from(response: Result<T, reqwasm::Error>) -> Self {
        match response {
            Ok(data) => RemoteData::Loaded(data),
            Err(error) => RemoteData::Error(error),
        }
    }
}
