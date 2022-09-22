
## Introduction

- Redux is awesome!
- Redux toolkit is an efficient Redux development toolset
- Typescript is super powerful
- [Normalized State in Redux](https://redux.js.org/usage/structuring-reducers/normalizing-state-shape) is a perfect way to structure your data

Sounds interesting! Since then, we tried to combine all above technologies into our React App but very soon, there were issues we have to deal with:
- We still have to write a lot of boilerplate, especially when you use Typescript in your project.
- Calling common API endpoints is repeatedly (CRUD APIs)
- Handling Loading Actions is boring
- Implement dummy data if the API is not ready to serve yet
- **How to deal efficiently with Normalized Data (pagination, data relation, loading, transform data, sort,...)**

[Redux Thunk Kit](https://github.com/rayyone/redux-thunk-kit) was born to solve the issues. It helps to work with Redux Toolkit, fetching and normalized data easily!

## Documentation

https://docs.rayyone.com/docs/category/ry-redux-thunk-kit