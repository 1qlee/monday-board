import React from "react";
import { useEffect, useState } from "react";
import "./App.css";
import mondaySdk from "monday-sdk-js";
import "monday-ui-react-core/dist/main.css";
//Explore more Monday React Components here: https://style.monday.com/
import { Flex, TextField, Button } from "monday-ui-react-core"

// Usage of mondaySDK example, for more information visit here: https://developer.monday.com/apps/docs/introduction-to-the-sdk/
const monday = mondaySdk();

const App = () => {
  const [values, setValues] = useState([
    { title: "Name", type: "text", id: "name"},
    { title: "Price", type: "numeric", id: "price" },
  ])

  useEffect(() => {
    // Notice this method notifies the monday platform that user gains a first value in an app.
    // Read more about it here: https://developer.monday.com/apps/docs/mondayexecute#value-created-for-user/
    monday.execute("valueCreatedForUser");

    monday.get("context").then(res => {
      console.log(res)
      console.log(res.data)
      const boardId = res.data.boardId || 3715125693 // placeholder
      const query = `query { boards (ids: ${boardId}) { columns { title type id }}}`

      monday.api(query).then(res => {
        // name board-relation multiple-person color color date text long-text numeric dropdown
        const columns = res.data.boards[0].columns

        setValues(columns)
      })
    }).catch(err => {
      console.log(err)
    })
  }, []);

  return (
    <div>
      <form>
        <Flex
          wrap={true}
        >
          {values.map(val => (
            <fieldset>
              <label
                htmlFor={val.id}
              >
                {val.title}
              </label>
              <TextField
                id={val.id}
              />
            </fieldset>
          ))}
        </Flex>
      </form>
      <Button>Save</Button>
    </div>
  );
};

export default App;
