import React from "react";
import { useEffect, useState } from "react";
import "./App.css";
import mondaySdk from "monday-sdk-js";
import "monday-ui-react-core/dist/main.css";
import { Check } from "monday-ui-react-core/icons";
import useKeyboardShortcut from "use-keyboard-shortcut"
import { Flex, TextField, Button, Loader, AlertBanner, AlertBannerText, Box, Toast } from "monday-ui-react-core"
import ColumnField from "./components/ColumnField"
import Subitems from "./components/Subitems"

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
  const [columnFields, setColumnFields] = useState([])
  const [subitemBoard, setSubitemBoard] = useState({})
  const [jobId, setJobId] = useState("")
  const [boardId, setBoardId] = useState(3715125693)
  const [jobEdits, setJobEdits] = useState({})
  const [jobName, setJobName] = useState("")
  const [jobDetails, setJobDetails] = useState({})
  const [jobIdValidation, setJobIdValidation] = useState({
    text: "",
    status: ""
  })
  const [jobNameError, setJobNameError] = useState({
    text: "",
    status: ""
  })
  const [appError, setAppError] = useState("")
  const colTypes = new Set(["text", "board-relation", "long-text", "numeric", "color", "date", "multiple-person"]);
  const [connectedBoard, setConnectedBoard] = useState({
    id: null,
    name: "",
    fieldId: "",
  })
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
      const columnsQuery = `query { boards (ids: ${boardId}) { columns { title type id settings_str }}}`

      // query for all columns belonging to this board then filter them based on user-inputtable fields (as defined in const coltypes
      // column query will return an array of objects where each object is a column/field 
      // then convert this array to an object with id:text pairs
      monday.api(columnsQuery).then(res => {
        const columns = res.data.boards[0].columns
        const subitems = columns.filter(col => col.id === "subitems")
        // filter all columns by the columns specified in settings
        const filteredColumns = columns.filter(col => colTypes.has(col.type))

        setSubitemBoard(JSON.parse(subitems[0].settings_str).boardIds[0])
        setColumnFields(filteredColumns)
        setJobDetails(parseColumnsDefault(filteredColumns)) // manually set default values for certain fields
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

          setJobIdValidation({
            text: "",
            status: "success",
          })
          setJobName(name)
          setJobDetails(parseColumns(filteredColumns))
          setFetching(false)
        }
        else {
          throw new Error("This job number doesn't exist!")
        }
      }).catch(error => {
        setJobIdValidation({
          text: "This job number doesn't exist!",
          status: "error",
        })
        setFetching(false)
      });
    }
    // else user has searched while leaving the jobId input blank
    else {
      setJobIdValidation({
        text: "Please enter a job number!",
        status: "error",
      })
    }
  }

  // save new job details or create a new job
  const saveJob = () => {
    console.log(connectedBoard)
    console.log(jobDetails)
    // check if we need to create an item in a connected board
    if (connectedBoard.id) {
      const stringifiedItemName = JSON.stringify(connectedBoard.name)
      const createItemQuery = `mutation { create_item (board_id: ${connectedBoard.id}, item_name: ${stringifiedItemName}) { id }}`
      const itemsArray = []

      monday.api(createItemQuery).then(res => {
        console.log(res)
        itemsArray[0] = res.id

        setJobDetails({
          ...jobDetails,
          [connectedBoard.fieldId]: {
            item_ids: itemsArray
          }
        })
      }).catch(error => {
        console.log(error)
      })
    }
    // check if the user has inputted a jobName
    if (jobName) {
      setSaving(true)
      const stringifiedJobName = JSON.stringify(jobName)

      // if jobId exists, we are updating an existing job item
      if (jobId) {
        const newJob = {
          ...jobEdits,
          name: jobName
        }
        // turn newJob into a JSON string so its readable in Monday
        const mutationString = JSON.stringify(JSON.stringify(newJob))
        console.log(mutationString)
        const updateJobQuery = `mutation { change_multiple_column_values(board_id: ${boardId}, item_id: ${jobId}, column_values: ${mutationString}) { id }}`

        monday.api(updateJobQuery).then(res => {
          setToast({
            msg: "Successfully updated job.",
            type: "positive",
            open: true,
          })
          setSaving(false)
        }).catch(error => {
          console.log(error)
          // almost always the error will be because of an invalid jobId
          setJobIdValidation({
            text: "This job number doesn't exist!",
            status: "error",
          })
          setSaving(false)
        })
      }
      // otherwise create a new job
      else {
        // for some reason we need to stringify twice for Monday api to understand
        const mutationString = JSON.stringify(JSON.stringify(jobEdits))
        console.log(mutationString)
        const createJobQuery = `mutation { create_item (board_id: ${boardId}, item_name: ${stringifiedJobName}, column_values: ${mutationString}) { id }}`

        monday.api(createJobQuery).then(res => {
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

  const parseColumns = array => {
    const arrayLength = array.length
    const objectDummy = {}

    for (let i = 0; i < arrayLength; i++) {
      objectDummy[array[i].id] = array[i]
    }

    return objectDummy
  }

  const parseColumnsDefault = array => {
    const arrayLength = array.length
    const fromAddress = "Unicorn Graphics\n971 Stewart Ave\nGarden City, NY 11530"
    const groundTracking = "1z10909203"
    const defaultEdits = {}
    const defaultValues = {}

    for (let i = 0; i < arrayLength; i++) {
      switch (array[i].title) {
        case "Priority":
          defaultValues[array[i].id] = {
            text: "None"
          }
          break
        case "Status":
          defaultValues[array[i].id] = {
            text: "Not started"
          }
          break
        case "Shipping method":
          defaultValues[array[i].id] = {
            text: "N/A"
          }
          break
        case "Ship from":
          defaultValues[array[i].id] = {
            text: fromAddress
          }
          defaultEdits[array[i].id] = fromAddress
          break
        case "Tracking":
          defaultValues[array[i].id] = {
            text: groundTracking
          }
          defaultEdits[array[i].id] = groundTracking
          break
        default:
          defaultValues[array[i].id] = array[i]
      }
    }

    setJobEdits(defaultEdits)

    return defaultValues
  }

  const handleJobId = value => {
    setJobIdValidation({})
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
                  iconName={jobIdValidation.status === "success" && Check}
                  className={jobIdValidation.status === "success" && "has-icon-success"}
                  validation={jobIdValidation}
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
                <fieldset className="large-fieldset">
                  <label htmlFor="name">Project name</label>
                  <TextField
                    required
                    className="is-flex-full"
                    onChange={handleJobName}
                    value={jobName}
                    validation={jobNameError}
                    id="name"
                  />
                </fieldset>
                {columnFields.map(field => (
                  <fieldset className="medium-fieldset">
                    <label htmlFor={field.id}>{field.title}</label>
                    <ColumnField
                      field={field}
                      jobDetails={jobDetails}
                      jobEdits={jobEdits}
                      monday={monday}
                      setConnectedBoard={setConnectedBoard}
                      setJobDetails={setJobDetails}
                      setJobEdits={setJobEdits}
                    />
                  </fieldset>
                ))}
                <Subitems
                  boardId={subitemBoard}
                  monday={monday}
                  colTypes={colTypes}
                />
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
