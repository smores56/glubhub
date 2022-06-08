use yew::Classes;

pub enum BulmaClass {
    IsActive,
}

impl Into<Classes> for BulmaClass {
    fn into(class: BulmaClass) -> Classes {
        let class_name = match class {
            BulmaClass::IsActive => "is-active",
        };

        class_name.into()
    }
}
