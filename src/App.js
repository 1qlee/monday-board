import React, { useCallback, useReducer } from "react";
import { useEffect, useState } from "react";
import "./App.css";
import mondaySdk from "monday-sdk-js";
import "monday-ui-react-core/dist/main.css";
import { Check } from "monday-ui-react-core/icons";
import useKeyboardShortcut from "use-keyboard-shortcut"
import { Flex, TextField, Button, Loader, AlertBanner, AlertBannerText, Box, Toast } from "monday-ui-react-core"
import Input from "./Input"

// Usage of mondaySDK example, for more information visit here: https://developer.monday.com/apps/docs/introduction-to-the-sdk/
const monday = mondaySdk();

const App = () => {
  const { flushHeldKeys } = useKeyboardShortcut(
    ["Control", "Enter"],
    () => saveJob(),
    {
      overrideSystem: false,
      ignoreInputFields: false,
      repeatOnHold: false
    }
  )
  const [columnFields, setColumnFields] = useState([
    { title: "Name", type: "text", id: "name", text: "Dummy text", value: "name" },
    { title: "Price", type: "numeric", id: "price", text: "$0", value: "price" },
  ])
  const [jobId, setJobId] = useState("")
  const [boardId, setBoardId] = useState(3715125693)
  const [jobDetails, setJobDetails] = useState({})
  const [jobName, setJobName] = useState("")
  const [jobIdError, setJobIdError] = useState({
    text: "",
    status: ""
  })
  const [jobNameError, setJobNameError] = useState({
    text: "",
    status: ""
  })
  const [appError, setAppError] = useState("")
  const colTypes = new Set(["text", "long-text", "numeric"]);
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState({
    msg: "",
    type: "positive",
    open: false,
  })

  flushHeldKeys()

  useEffect(() => {
    monday.execute("valueCreatedForUser");

    // get the current boardId from Monday then run a query to get all columns from that board
    // then filter those columns by inputtable fields (e.g. text)
    monday.get("context").then(res => {
      // res should be the context for the current board that the user has installed this app in
      setBoardId(res.data.boardId || 3715125693);
      const columnsQuery = `query { boards (ids: ${boardId}) { columns { title type id settings_str }}}`;

      // query for all columns belonging to this board then filter them based on user-inputtable fields (as defined in const coltypes
      // column query will return an array of objects where each object is a column/field 
      // then convert this array to an object with id:text pairs
      monday.api(columnsQuery).then(res => {
        const columns = res.data.boards[0].columns
        const filteredColumns = columns.filter(col => colTypes.has(col.type))

        setColumnFields(filteredColumns)
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
  
      // query for all column values for the specified job (board item)
      monday.api(jobQuery).then(res => {
        if (res.data.boards[0].items.length > 0) {
          const results = res.data.boards[0].items[0]
          const { name } = results
          const columns = results.column_values
          const filteredColumns = columns.filter(col => colTypes.has(col.type))
          
          setJobIdError({
            text: "",
            status: "success",
          })
          setJobName(name)
          setColumnFields(filteredColumns)
          setJobDetails(arrayToObj(filteredColumns))
          setFetching(false)
        }
        else {
          throw new Error("This job number doesn't exist!")
        }
      }).catch(error => {
        setJobIdError({
          text: "This job number doesn't exist!",
          status: "error",
        })
        setFetching(false)
      });
    }
    // else user has searched while leaving the jobId input blank
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

  // save new job details or create a new job
  const saveJob = () => {
    // check if the user has inputted a jobName
    if (jobName) {
      const objectDummy = {}
      const stringifiedJobName = JSON.stringify(jobName)

      setSaving(true)

      // jobDetails is an object with column_id: { col_values: value }
      // parse it to create an object with key:value pairs that matches id:text/value so that Monday api can understand it
      for (let job in jobDetails) {
        objectDummy[jobDetails[job].id] = jobDetails[job].text
      }
      
      // if jobId exists, we are updating an existing job item
      if (jobId) {
        objectDummy["name"] = jobName
        // for some reason we need to stringify twice for Monday api to understand
        const mutationString = JSON.stringify(JSON.stringify(objectDummy))
        const updateJob = `mutation { change_multiple_column_values(board_id: ${boardId}, item_id: ${jobId}, column_values: ${mutationString}) { id }}`

        monday.api(updateJob).then(res => {
          setToast({
            msg: "Successfully updated job.",
            type: "positive",
            open: true,
          })
          setSaving(false)
        }).catch(error => {
          // almost always the error will be because of an invalid jobId
          setJobIdError({
            text: "This job number doesn't exist!",
            status: "error",
          })
          setSaving(false)
        })
      }
      // otherwise create a new job
      else {
        // for some reason we need to stringify twice for Monday api to understand
        const mutationString = JSON.stringify(JSON.stringify(objectDummy))
        const createJob = `mutation { create_item (board_id: ${boardId}, item_name: ${stringifiedJobName}, column_values: ${mutationString}) { id }}`

        monday.api(createJob).then(res => {
          setToast({
            msg: "Successfully created a new job.",
            type: "positive",
            open: true,
          })
          setSaving(false)
        }).catch(error => {
          console.log(error)
          setAppError("Could not process. Please refresh and try again.")
          setSaving(false)
        })
      }
    }
    else {
      setJobNameError({
        text: "You must enter a name for this job.",
        status: "error",
      })
    }
  }

  const handleJobId = value => {
    setJobIdError({})
    setAppError("")
    setJobId(value)
  }

  const handleJobName = value => {
    const stringVal = String(value)
    setAppError("")
    setJobNameError({})
    setJobName(stringVal)
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
          <Toast 
            children={toast.msg}
            open={toast.open}
            type={toast.type}
            onClose={() => setToast({ ...toast, open: false })}
            autoHideDuration={2000}
            className="toast monday-storybook-toast_wrapper"
          />
          {appError && (
            <AlertBanner 
              backgroundColor="negative"
              bannerText={appError}
              onClose={() => setAppError("")}
              className="monday-storybook-alert-banner_big-container has-margin-bottom"
            >
              <AlertBannerText text={appError} />
            </AlertBanner>
          )}
          <Flex
            gap={24}
            direction="Column"
            align="Start"
            justify="Start"
          >
            <Box 
              border={Box.borders.DEFAULT} 
              rounded={Box.roundeds.SMALL} 
              padding={Box.paddings.MEDIUM}
              backgroundColor={Box.backgroundColors.GREY_BACKGROUND_COLOR}
              className="searchbox"
            >
              <label htmlFor="jobId">Job number</label>
              <Flex
                gap={8}
                align="start"
              >
                <TextField
                  id="jobId"
                  onChange={handleJobId}
                  onKeyDown={e => e.key === "Enter" && getJob()}
                  placeholder="Leave blank to create a new job"
                  iconName={jobIdError.status === "success" && Check}
                  className={jobIdError.status === "success" && "has-icon-success"}
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
            </Box>
            <Box
              border={Box.borders.DEFAULT}
              rounded={Box.roundeds.SMALL}
              padding={Box.paddings.MEDIUM}
              backgroundColor={Box.backgroundColors.GREY_BACKGROUND_COLOR}
            >
              <Flex
                align="start"
                gap={8}
                wrap={true}
              >
                <fieldset className="is-third-width">
                  <label htmlFor="name">Name</label>
                  <TextField
                    required
                    className="is-flex-full"
                    onChange={handleJobName}
                    value={jobName}
                    validation={jobNameError}
                    id="name"
                  />
                </fieldset>
                {columnFields.map(col => (
                  <fieldset>
                    <label htmlFor={col.id}>{col.title}</label>
                    <Input
                      input={col}
                      jobDetails={jobDetails}
                      setJobDetails={setJobDetails}
                    />
                  </fieldset>
                ))}
              </Flex>
            </Box>
            <Button
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
          </Flex>
        </div>
      )}
    </>
  );
};

export default App;
