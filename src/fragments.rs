pub mod schema {
    cynic::use_schema!("schema.graphql");
}

#[derive(cynic::QueryFragment)]
#[cynic(schema_path = "schema.graphql", schema_module = "schema")]
pub struct Member {
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub preferred_name: Option<String>,
    pub full_name: String,
    pub phone_number: String,
    pub picture: Option<String>,
    pub passengers: i32,
    pub location: String,
    pub on_campus: Option<bool>,
    pub about: Option<String>,
    pub major: Option<String>,
    pub minor: Option<String>,
    pub hometown: Option<String>,
    pub arrived_at_tech: Option<i32>,
    pub gateway_drug: Option<String>,
    pub conflicts: Option<String>,
    pub dietary_restrictions: Option<String>,
    pub semester: Option<ActiveSemester>,
    pub positions: Vec<Role>,
    pub permissions: Vec<MemberPermission>,
    pub semesters: Vec<ActiveSemester>,
    pub grades: Grades,
    pub transactions: Vec<ClubTransaction>,
}

#[derive(cynic::QueryFragment)]
#[cynic(schema_path = "schema.graphql", schema_module = "schema")]
pub struct ActiveSemester {
    pub member: String,
    pub semester: String,
    pub enrollment: Enrollment,
    pub section: Option<String>,
    pub grades: Grades,
}

#[derive(cynic::Enum, Clone, Copy, Debug)]
#[cynic(schema_path = "schema.graphql", schema_module = "schema")]
pub enum Enrollment {
    Club,
    Class,
}

#[derive(cynic::QueryFragment)]
#[cynic(schema_path = "schema.graphql", schema_module = "schema")]
pub struct Grades {
    pub grade: f64,
    pub events_with_changes: Vec<EventWithGradeChange>,
    pub volunteer_gigs_attended: usize,
}

#[derive(cynic::QueryFragment)]
#[cynic(schema_path = "schema.graphql", schema_module = "schema")]
pub struct EventWithGradeChange {
    pub event: Event,
    pub change: GradeChange,
}

#[derive(cynic::QueryFragment)]
#[cynic(schema_path = "schema.graphql", schema_module = "schema")]
pub struct GradeChange {
    pub reason: String,
    pub change: f64,
    pub partial_score: f64,
}

#[derive(cynic::Enum, Clone, Copy, Debug)]
#[cynic(schema_path = "schema.graphql", schema_module = "schema")]
pub enum Period {
    Daily,
    Weekly,
    Biweekly,
    Monthly,
    Yearly,
}

#[derive(cynic::QueryFragment)]
#[cynic(schema_path = "schema.graphql", schema_module = "schema")]
pub struct EventType {
    pub name: String,
    pub weight: i32,
}

#[derive(cynic::QueryFragment)]
#[cynic(schema_path = "schema.graphql", schema_module = "schema")]
pub struct Event {
    pub id: i32,
    pub name: String,
    pub semester: String,
    pub r#type: String,
    pub call_time: GqlDateTime,
    pub release_time: Option<GqlDateTime>,
    pub points: i32,
    pub comments: Option<String>,
    pub location: Option<String>,
    pub gig_count: bool,
    pub default_attend: bool,
    pub gig: Option<Gig>,
    pub user_attendance: Option<Attendance>,
    pub all_attendance: Vec<Attendance>,
    pub carpools: Vec<Carpool>,
    pub setlist: Vec<Song>,
}
