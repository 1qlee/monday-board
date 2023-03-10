import React from "react";
import { useEffect, useState } from "react";
import "./App.css";
import mondaySdk from "monday-sdk-js";
import "monday-ui-react-core/dist/main.css";
import { Check, Add } from "monday-ui-react-core/icons";
import useKeyboardShortcut from "use-keyboard-shortcut"
import { Flex, TextField, Button, Loader, AlertBanner, AlertBannerText, Box, Toast, IconButton } from "monday-ui-react-core"
import ColumnField from "./components/ColumnField"
import SubitemField from "./components/SubitemField"

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
  const [boardId, setBoardId] = useState(3715125693)
  const [columnFields, setColumnFields] = useState([])
  const [textFields, setTextFields] = useState([])
  const [longTextFields, setLongTextFields] = useState([])
  const [peopleFields, setPeopleFields] = useState([])
  const [numericFields, setNumericFields] = useState([])
  const [dateFields, setDateFields] = useState([])
  const [relationFields, setRelationFields] = useState([])
  const [colorFields, setColorFields] = useState([])
  const [jobDetails, setJobDetails] = useState({})
  const [jobEdits, setJobEdits] = useState({})
  const [jobId, setJobId] = useState("")
  const [jobName, setJobName] = useState("")
  const [subitemBoardId, setSubitemBoardId] = useState(0)
  const [subitemEdits, setSubitemEdits] = useState([])
  const [subitems, setSubitems] = useState([])
  const [subitemFields, setSubitemFields] = useState([])
  const [jobIdValidation, setJobIdValidation] = useState({
    text: "",
    status: ""
  })
  const [jobNameError, setJobNameError] = useState({
    text: "",
    status: ""
  })
  const [appError, setAppError] = useState("")
  const colTypes = new Set(["text", "board-relation", "long-text", "numeric", "color", "date", "multiple-person"])
  const subitemColTypes = new Set(["name", "text", "long-text", "numeric", "color", "date"])
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
        // filter all columns by the columns specified in settings
        const filteredColumns = columns.filter(col => colTypes.has(col.type))
        const subitemsColumn = columns.filter(col => col.id === "subitems")

        setColumnFields(filteredColumns)
        splitColumnFields(filteredColumns)
        setJobDetails(parseColumnsDefault(filteredColumns)) // manually set default values for certain fields

        // extract subitems board id 
        return JSON.parse(subitemsColumn[0].settings_str).boardIds[0]
      }).then(parsedBoardId => {
        setSubitemBoardId(parsedBoardId)
        // query for all columns in the subitem board
        const subitemsQuery = `query { boards (ids: ${parsedBoardId}) { columns { title type id settings_str }}}`

        monday.api(subitemsQuery).then(res => {
          const columns = res.data.boards[0].columns
          const filteredColumns = columns.filter(col => subitemColTypes.has(col.type))

          setSubitemFields(filteredColumns)
          setSubitems(parseSubitemsDefault(filteredColumns))
          setLoading(false)
        })
      })
    }).catch(() => {
      setAppError("Something went wrong. Please refresh the page. If this problem persists, try reinstalling the app.")
      setLoading(false)
    });
  }, []);

  // retrieve a specific job (an item in Monday)
  const getJob = () => {
    setSubitemEdits([])
    setJobEdits({})

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
        }
        else {
          throw new Error("This job number doesn't exist!")
        }
      }).then(() => {
        const subitemQuery = `query { boards (ids: ${boardId}) { items(ids: ${jobId}) { subitems { id name column_values { text type title value id}}}}}`

        // query for all subitem values
        monday.api(subitemQuery).then(res => {
          const results = res.data.boards[0].items[0].subitems

          if (results) {
            setSubitems(parseSubitems(results))
          }
          else {
            setSubitems(parseSubitemsDefault(subitemFields))
          }

          setFetching(false)
        })
      }).catch(() => {
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
        const updateJobQuery = `mutation { change_multiple_column_values(board_id: ${boardId}, item_id: ${jobId}, column_values: ${mutationString}) { id }}`

        // update the job
        monday.api(updateJobQuery).then(res => {
          return res.data.change_multiple_column_values.id
        }).then(parentItemId => {
          const numOfSubitems = subitemEdits.length

          // check if we have any subitem edits 
          if (numOfSubitems > 0) {
            for (let i = 0; i < numOfSubitems; i++) {
              const currentSubitem = subitemEdits[i]
              console.log(currentSubitem)
              const stringifiedSubitemName = currentSubitem.column_values.name
              console.log(stringifiedSubitemName)
              const mutationString = JSON.stringify(JSON.stringify(currentSubitem.column_values))
              console.log(mutationString)

              // check if the subitem exists by checking id
              if (currentSubitem.id) {
                const updateSubitemQuery = `mutation { change_multiple_column_values(board_id: ${subitemBoardId}, item_id: ${currentSubitem.id}, column_values: ${mutationString}) { id }}`

                monday.api(updateSubitemQuery).then(() => {
                  if (i === numOfSubitems - 1) {
                    setToast({
                      msg: "Successfully updated job.",
                      type: "positive",
                      open: true,
                    })
                    return setSaving(false)
                  }
                })
              }
              // otherwise we have to create a new subitem
              else {
                const createSubitemQuery = `mutation { create_subitem (parent_item_id: ${parentItemId}, item_name: ${stringifiedSubitemName}, column_values: ${mutationString}) { id }}`

                monday.api(createSubitemQuery).then(() => {
                  if (i === numOfSubitems - 1) {
                    setToast({
                      msg: "Successfully updated job.",
                      type: "positive",
                      open: true,
                    })
                    return setSaving(false)
                  }
                })
              }
            }
          }
          else {
            setToast({
              msg: "Successfully updated job.",
              type: "positive",
              open: true,
            })
            setSaving(false)
          }
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
        const createJobQuery = `mutation { create_item (board_id: ${boardId}, item_name: ${stringifiedJobName}, column_values: ${mutationString}) { id }}`

        monday.api(createJobQuery).then(res => {
          return res.data.create_item.id
        }).then(parentItemId => {
          const numOfSubitems = subitemEdits.length

          if (numOfSubitems > 0) {
            for (let i = 0; i < numOfSubitems; i++) {
              const currentSubitem = subitemEdits[i].column_values
              const mutationString = JSON.stringify(JSON.stringify(currentSubitem))
              const stringifiedSubitemName = JSON.stringify(currentSubitem.name)
              const createSubitemQuery = `mutation { create_subitem (parent_item_id: ${parentItemId}, item_name: ${stringifiedSubitemName}, column_values: ${mutationString}) { id }}`

              monday.api(createSubitemQuery).then(() => {
                if (i === numOfSubitems - 1) {
                  setToast({
                    msg: "Successfully created a new job.",
                    type: "positive",
                    open: true,
                  })
                  return setSaving(false)
                }
              })
            }
          }
          else {
            setToast({
              msg: "Successfully created a new job.",
              type: "positive",
              open: true,
            })
            return setSaving(false)
          }
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

  // format array of subitems
  const parseSubitems = array => {
    const allFormattedSubitems = []

    array.forEach(subitem => {
      const formattedSubitem = {}
      const { column_values, name, id } = subitem
      const filteredColumns = column_values.filter(col => subitemColTypes.has(col.type))

      // handle name and id columns separately
      formattedSubitem["name"] = { text: name}
      formattedSubitem["id"] = { text: id }
      
      filteredColumns.forEach(value => {
        formattedSubitem[value.id] = value
      })

      allFormattedSubitems.push(formattedSubitem)
    })

    console.log(allFormattedSubitems)

    return allFormattedSubitems
  }

  const parseSubitemsDefault = array => {
    const arrayLength = array.length
    const formattedSubitem = {}
    const allFormattedSubitems = []

    for (let i = 0; i < arrayLength; i++) {
      formattedSubitem[array[i].id] = {
        text: "",
        type: array[i].type,
        title: array[i].title,
        value: "",
        id: "",
      }
    }

    allFormattedSubitems.push(formattedSubitem)

    return allFormattedSubitems
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

  const handleAddSubitemRow = () => {
    const arrayLength = subitemFields.length
    const objectDummy = {}

    for (let i = 0; i < arrayLength; i++) {
      objectDummy[subitemFields[i].id] = {
        text: "",
        type: subitemFields[i].type,
        title: subitemFields[i].title,
        value: "",
        id: "",
      }
    }

    setSubitems([
      ...subitems,
      objectDummy,
    ])
  }

  const splitColumnFields = columns => {
    // break up columns by type
    const numOfCols = columns.length
    // set each column type separately in state
    for (let i = 0; i < numOfCols; i++) {
      switch (columns[i].type) {
        case "text":
          setTextFields(prevFields => [...prevFields, columns[i]])
          break
        case "long-text":
          setLongTextFields(prevFields => [...prevFields, columns[i]])
          break
        case "board-relation":
          setRelationFields(prevFields => [...prevFields, columns[i]])
          break
        case "date":
          setDateFields(prevFields => [...prevFields, columns[i]])
          break
        case "multiple-person":
          setPeopleFields(prevFields => [...prevFields, columns[i]])
          break
        case "color":
          setColorFields(prevFields => [...prevFields, columns[i]])
          break
        case "numeric":
          setNumericFields(prevFields => [...prevFields, columns[i]])
          break
      }
    }
  }

  const returnColumnFields = field => {
    return (
      <td>
        <ColumnField
          field={field}
          jobDetails={jobDetails}
          jobEdits={jobEdits}
          monday={monday}
          setConnectedBoard={setConnectedBoard}
          setJobDetails={setJobDetails}
          setJobEdits={setJobEdits}
        />
      </td>
    )
  }

  const returnColumnHeaders = field => {
    return (
      <th>
        <label htmlFor={field.id}>{field.title}</label>
      </th>
    )
  }

  const setSubitemFieldWidth = field => {
    if (field.title === "Name") {
      return "192px"
    }
    else if (field.title === "Description") {
      return "288px"
    }
    else if (field.type === "numeric") {
      return "36px"
    }
    else if (field.type === "text") {
      return "36px"
    }
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
            <Flex
              align={Flex.align.START}
              justify={Flex.justify.SPACE_BETWEEN}
            >
              <Box
                border={Box.borders.DEFAULT}
                padding={Box.paddings.NONE}
              >
                <label
                  className="label-header"
                  htmlFor="jobId"
                >Job number</label>
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
                    className={jobIdValidation.status === "success" ? "has-icon-success custom-input-component" : "custom-input-component"}
                    validation={jobIdValidation}
                  />
                  <Button
                    disabled={fetching || saving}
                    loading={fetching}
                    leftFlat
                    rightFlat
                    onClick={() => getJob()}
                    size="small"
                  >
                    Search
                  </Button>
                </Flex>
              </Box>
            </Flex>
            <table>
              <thead>
                <th style={{width: "192px"}}><label htmlFor="job-name">Job Name</label></th>
                {textFields.map(field => returnColumnHeaders(field))}
                {relationFields.map(field => returnColumnHeaders(field))}
                {dateFields.map(field => returnColumnHeaders(field))}
                {peopleFields.map(field => returnColumnHeaders(field))}
                {colorFields.map(field => returnColumnHeaders(field))}
              </thead>
              <tbody>
                <tr>
                  <td>
                    <TextField
                      className="custom-input-component--table"
                      required
                      autoComplete="off"
                      onChange={handleJobName}
                      value={jobName}
                      validation={jobNameError}
                      id="job-name"
                    />
                  </td>
                  {textFields.map(field => returnColumnFields(field))}
                  {relationFields.map(field => returnColumnFields(field))}
                  {dateFields.map(field => returnColumnFields(field))}
                  {peopleFields.map(field => returnColumnFields(field))}
                  {colorFields.map(field => returnColumnFields(field))}
                </tr>
              </tbody>
            </table>
            <table>
              <thead>
                {longTextFields.map(field => returnColumnHeaders(field))}
              </thead>
              <tbody>
                <tr>
                  {longTextFields.map(field => returnColumnFields(field))}
                </tr>
              </tbody>
            </table>
            <table>
              <thead>
                {subitemFields.map(field => (
                  <th
                    style={{ width: setSubitemFieldWidth(field)}}
                  >
                    {field.title}
                  </th>
                ))}
              </thead>
              <tbody>
                {subitems.map((subitem, index) => (
                  <tr>
                    {subitemFields.map(field => (
                      <td>
                        <SubitemField
                          field={field}
                          index={index}
                          setSubitemEdits={setSubitemEdits}
                          setSubitems={setSubitems}
                          subitems={subitems}
                          subitem={subitem}
                          subitemEdits={subitemEdits}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td>
                    <IconButton
                      ariaLabel="Add row"
                      icon={Add}
                      onClick={() => handleAddSubitemRow()}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
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
