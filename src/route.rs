use yew_router::Routable;
//
// Route Constructors

#[derive(Routable, Debug)]
pub enum Route {
    #[at("/")]
    Home,
    #[at("/login")]
    Login,
    #[at("/roster")]
    Roster,
    #[at("/profile/:email")]
    Profile {
        email: String,
        tab: Option<ProfileTab>,
    },
    #[at("/edit-profile/:email")]
    EditProfile {
        email: String,
    },
    #[at("/events/:event_id")]
    Events {
        event_id: Option<i32>,
        tab: Option<EventTab>,
    },
    EditCarpools {
        event_id: i32,
    },
    Repertoire {
        song_id: Option<i32>,
        tab: Option<RepertoireTab>,
    },
    Minutes {
        minutes_id: Option<i32>,
        tab: Option<MinutesTab>,
    },
    ForgotPassword,
    ResetPassword {
        token: Option<String>,
    },
    Admin {
        tab: Option<AdminTab>,
    },
}

pub enum EventTab {
    Details,
    // Who's Attending
    Attendees,
    Setlist,
    Carpools,
    RequestAbsence,
    Edit,
}

pub enum MinutesTab {
    Public,
    Private,
    Edit,
}

pub enum ProfileTab {
    Details,
    Money,
    Attendance,
    Semesters,
}

pub enum AdminTab {
    CreateEvent { gig_request_id: Option<i32> },
    GigRequests,
    AbsenceRequests,
    // Edit the Semester
    Semesters { tab: Option<SemesterTab> },
    // Edit officers
    Officers,
    Permissions,
    Documents,
    // Upload API or Site
    WebmasterTools,
    Uniforms,
    Money { tab: Option<MoneyTab> },
}

pub enum MoneyTab {
    // Assign everyone dues
    AssignDues,
    // Make remaining dues late
    AssignLateDues,
    // Bake a batch of chocolate chip transactions
    Transactions,
}

pub enum SemesterTab {
    // Switch semesters
    Change,
    // Birth a semester
    Create,
    // Edit this semester
    Edit,
}

pub enum RepertoireTab {
    Details,
    Edit,
}
