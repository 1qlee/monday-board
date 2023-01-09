import React from "react";
import { useEffect, useState } from "react";
import "./App.css";
import mondaySdk from "monday-sdk-js";
import "monday-ui-react-core/dist/main.css";
//Explore more Monday React Components here: https://style.monday.com/
import { Flex, TextField, Button, Loader, AlertBanner } from "monday-ui-react-core"
import Input from "./Input"

// Usage of mondaySDK example, for more information visit here: https://developer.monday.com/apps/docs/introduction-to-the-sdk/
const monday = mondaySdk();

const App = () => {
  const [values, setValues] = useState([
    { title: "Name", type: "text", id: "name", text: "Dummy text", value: "name" },
    { title: "Price", type: "numeric", id: "price", text: "$0", value: "price" },
  ])
  const [jobId, setJobId] = useState("")
  const [boardId, setBoardId] = useState(3715125693)
  const [jobDetails, setJobDetails] = useState({})
  const [jobIdError, setJobIdError] = useState({
    text: "",
    status: ""
  })
  const [appError, setAppError] = useState("")
  const colTypes = new Set(["name", "text", "long-text", "numeric"]);
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    monday.execute("valueCreatedForUser");

    // get the current boardId from Monday then run a query to get all columns from that board
    // then filter those columns by inputtable fields (e.g. text)
    monday.get("context").then(res => {
      // res should be the context for the current board that the user has installed this app in
      setBoardId(res.data.boardId || 3715125693);
      const columnsQuery = `query { boards (ids: ${boardId}) { columns { title type id settings_str }}}`;

      // query for all columns then filter
      monday.api(columnsQuery).then(res => {
        const columns = res.data.boards[0].columns
        const filteredColumns = columns.filter(col => colTypes.has(col.type))

        setValues(filteredColumns)
        setJobDetails(arrayToObj(filteredColumns))
        setLoading(false)
      });
    }).catch(() => {
      setAppError("Something went wrong. Please refresh the page. If this problem persists, try reinstalling the app.")
      setLoading(false)
    });
  }, []);

  // retrieve a specific job (an item in Monday)
  const getJob = () => {
    if (jobId) {
      setFetching(true)
      const jobQuery = `query { boards (ids: ${boardId}) { items(ids: ${jobId}) { name column_values { text type title value id }}}}`;
  
      // returns an array of all column values for the specified job (board item)
      monday.api(jobQuery).then(res => {
        console.log(res)

        if (res.data.boards[0].items.length > 0) {
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

          setValues(filteredColumns)
          setJobDetails(arrayToObj(filteredColumns))
          setFetching(false)
        }
        else {
          setJobIdError({
            text: "That job number doesn't exist!",
            status: "error",
          })
          setFetching(false)
        }
      }).catch(() => {
        setJobIdError({
          text: "That job number doesn't exist!",
          status: "error",
        })
        setFetching(false)
      });
    }
    else {
      setJobIdError({
        text: "Please enter a job number!",
        status: "error",
      })
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
    setSaving(true)
    const objectDummy = {}

    // jobDetails is an object with column_id: { col_values: value }
    for (let job in jobDetails) {
      objectDummy[jobDetails[job].id] = jobDetails[job].text
    }
    console.log(objectDummy)
    const mutationString = JSON.stringify(JSON.stringify(objectDummy))
    console.log(mutationString)
    const jobMutation = `mutation { change_multiple_column_values(board_id: ${boardId}, item_id: ${jobId}, column_values: ${mutationString}) {id}}`

    monday.api(jobMutation).then(res => {
      console.log(res)
      setSaving(false)
    }).catch(error => {
      console.log(error)
      setAppError(error.error_message)
      setSaving(false)
    })
  }

  const handleJobId = value => {
    setJobIdError({})
    setJobId(value)
  }

  return (
    <>
      {loading ? (
        <div className="loader">
          <Loader 
            color="primary"
            size={64}
          />
        </div>
      ) : (
        <div className="app">
          {appError && (
            <AlertBanner 
              backgroundColor="negative"
              bannerText={appError}
              isCloseHidden={true}
            />
          )}
          <label htmlFor="jobId">Job number</label>
          <Flex
            gap={8}
            align="start"
            style={{ width: "360px" }}
          >
            <TextField
              id="jobId"
              onChange={handleJobId}
              onKeyDown={e => e.key === "Enter" && getJob()}
              placeholder="Leave blank to create a new job"
              validation={jobIdError}
            />
            <Button
              disabled={fetching || saving}
              loading={fetching}
              onClick={() => getJob()}
              size="small"
            >
              Search
            </Button>
          </Flex>
          <form>
            <Flex
              align="start"
              gap={8}
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
            onClick={() => saveJob()}
            loading={saving}
            disabled={fetching || saving}
          >
            {jobId ? (
              "Save"
            ) : (
              "Submit"
            )}
          </Button>
        </div>
      )}
    </>
  );
};

export default App;
