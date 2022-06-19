use cynic::MutationRoot;

#[derive(cynic::FragmentArguments)]
struct LoginArguments {
    pub email: String,
    pub pass_hash: String,
}
