import React from "react";
import { useEffect, useState } from "react";
import "./App.css";
import mondaySdk from "monday-sdk-js";
import "monday-ui-react-core/dist/main.css";
//Explore more Monday React Components here: https://style.monday.com/
import { Flex, TextField, Button, Label, Dropdown } from "monday-ui-react-core"
import Input from "./Input"

// Usage of mondaySDK example, for more information visit here: https://developer.monday.com/apps/docs/introduction-to-the-sdk/
const monday = mondaySdk();

const App = () => {
  const [values, setValues] = useState([
    { title: "Name", type: "text", id: "name" },
    { title: "Price", type: "numeric", id: "price" },
  ])
  const [jobNum, setJobNum] = useState("")
  const [boardId, setBoardId] = useState(3715125693)
  const colTypes = new Set(["name", "board-relation", "multiple-person", "color", "date", "text", "long-text", "numeric", "dropdown"]);

  useEffect(() => {
    monday.execute("valueCreatedForUser");

    monday.get("context").then(res => {
      console.log(res.data)
      setBoardId(res.data.boardId || 3715125693);
      const columnsQuery = `query { boards (ids: ${boardId}) { columns { title type id settings_str }}}`;

      monday.api(columnsQuery).then(res => {
        console.log(res.data.boards)
        const columns = res.data.boards[0].columns
        const filteredColumns = columns.filter(col => colTypes.has(col.type))

        if (filteredColumns) {
          setValues(filteredColumns)
        } 
      });
    }).catch(err => {
      console.log(err)
    });
  }, []);

  const getJob = () => {
    if (jobNum) {
      const jobQuery = `query { boards (ids: ${boardId}) { items(ids: ${jobNum}) { name column_values { text type title value }}}}`;
  
      // returns an array of all column values for the specified job aka item
      monday.api(jobQuery).then(res => {
        console.log(res)
        const results = res.data.boards[0].items[0]
        const { name } = results
        const columns = results.column_values
        console.log(columns)
        const filteredColumns = columns.filter(col => colTypes.has(col.type))
        filteredColumns.unshift({
          text: name,
          title: "Name",
          type: "name",
        })

        if (filteredColumns) {
          setValues(filteredColumns)
        } 
      });
    }
    else {
      console.error("Need job number!")
    }
  }

  return (
    <div>
      <div>
        <label htmlFor="jobNum">Job number</label>
        <TextField
          id="jobNum"
          onChange={setJobNum}
          onKeyDown={e => e.key === "Enter" && getJob()}
          placeholder="Job number"
          trim={true}
        />
        <Button
          onClick={() => getJob()}
        >
          Submit
        </Button>
      </div>
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
              <Input 
                inputProps={val}
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
