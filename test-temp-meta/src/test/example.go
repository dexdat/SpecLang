package test

type TestStruct struct {
    ID   int
    Name string
}

func NewTestStruct(id int, name string) *TestStruct {
    return &TestStruct{ID: id, Name: name}
}

const TestConstant = "test"
