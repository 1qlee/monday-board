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
    { title: "Name", type: "text", id: "name", text: "Dummy text", value: "name" },
    { title: "Price", type: "numeric", id: "price", text: "$0", value: "price" },
  ])
  const [jobNum, setJobNum] = useState("")
  const [boardId, setBoardId] = useState(3715125693)
  const [jobDetails, setJobDetails] = useState({
    name: {
      title: "Name", type: "text", id: "name", text: "Dummy text", value: "name",
    },
    priority1: {
      title: "Priority", type: "text", id: "name", text: "Dummy text", value: '{"done_colors":[1],"color_mapping":{"2":10,"7":15,"9":109,"10":19,"15":7,"19":110,"109":9,"110":2},"labels":{"5":"None","7":"Low","109":"Medium","110":"High"},"labels_positions_v2":{"5":3,"7":2,"109":1,"110":0},"labels_colors":{"5":{"color":"#c4c4c4","border":"#B0B0B0","var_name":"grey"},"7":{"color":"#9CD326","border":"#89B921","var_name":"lime - green"},"109":{"color":"#FFCB00","border":"#C0AB1B","var_name":"yellow"},"110":{"color":"#e2445c","border":"#CE3048","var_name":"red - shadow"}}}',
    },
  })
  const colTypes = new Set(["name", "board-relation", "multiple-person", "color", "date", "text", "long-text", "numeric", "dropdown"]);

  useEffect(() => {
    monday.execute("valueCreatedForUser");

    // get the current boardId from Monday
    monday.get("context").then(res => {
      console.log(res.data)
      setBoardId(res.data.boardId || 3715125693);
      const columnsQuery = `query { boards (ids: ${boardId}) { columns { title type id settings_str }}}`;

      // get all columns and filter them for inputtable fields
      monday.api(columnsQuery).then(res => {
        console.log(res.data.boards)
        const columns = res.data.boards[0].columns
        const filteredColumns = columns.filter(col => colTypes.has(col.type))

        if (filteredColumns) {
          setValues(filteredColumns)
          setJobDetails(arrayToObj(filteredColumns))
        } 
      });
    }).catch(err => {
      console.log(err)
    });
  }, []);

  // retrieve a specific job (an item in Monday)
  const getJob = () => {
    if (jobNum) {
      const jobQuery = `query { boards (ids: ${boardId}) { items(ids: ${jobNum}) { name column_values { text type title value id }}}}`;
  
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
          id: "name",
        })

        if (filteredColumns) {
          setValues(filteredColumns)
          setJobDetails(arrayToObj(filteredColumns))
        }
      });
    }
    else {
      console.error("Need job number!")
    }
  }

  const arrayToObj = array => {
    const arrayLength = array.length
    const objectDummy = {}

    for (let i = 0; i < arrayLength; i++) {
      objectDummy[array[i].id] = array[i]
    }

    return objectDummy
  }

  const saveJob = () => {

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
              <label htmlFor={val.id}>{val.title}</label>
              <Input 
                input={val}
                jobDetails={jobDetails}
                setJobDetails={setJobDetails}
              />
            </fieldset>
          ))}
        </Flex>
      </form>
      <Button
        type="submit"
        name=""
      >
        Save
      </Button>
    </div>
  );
};

export default App;
