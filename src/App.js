import React from "react";
import { useEffect, useState } from "react";
import "./App.css";
import mondaySdk from "monday-sdk-js";
import "monday-ui-react-core/dist/main.css";
import { Check } from "monday-ui-react-core/icons";
import useKeyboardShortcut from "use-keyboard-shortcut"
import { Flex, TextField, Button, Loader, AlertBanner, AlertBannerText, Box, Toast, IconButton, RadioButton } from "monday-ui-react-core"
import ColumnField from "./components/ColumnField"
import SubitemField from "./components/SubitemField"
import AccountInfo from "./components/AccountInfo"

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
  const [boardId, setBoardId] = useState(4124009029)
  const [columnFields, setColumnFields] = useState([])
  const [textFields, setTextFields] = useState([])
  const [longTextFields, setLongTextFields] = useState([])
  const [peopleFields, setPeopleFields] = useState([])
  const [numericFields, setNumericFields] = useState([])
  const [dateFields, setDateFields] = useState([])
  const [boardRelationField, setBoardRelationField] = useState([])
  const [colorFields, setColorFields] = useState([])
  const [jobDetails, setJobDetails] = useState({})
  const [jobEdits, setJobEdits] = useState({})
  const [jobNumber, setJobNumber] = useState("")
  const [nextJobNumber, setNextJobNumber] = useState("")
  const [jobId, setJobId] = useState(0)
  const [subitemBoardId, setSubitemBoardId] = useState(0)
  const [subitemEdits, setSubitemEdits] = useState([])
  const [subitems, setSubitems] = useState([])
  const [subitemFields, setSubitemFields] = useState([])
  const [jobNumberError, setJobNumberError] = useState({
    text: "",
    status: "",
  })
  const [jobNumberValidation, setJobNumberValidation] = useState({
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
  const uimsLabels = ["UP", "QU", "CL"]
  const [activeUimsLabel, setActiveUimsLabel] = useState("UP")
  const [uimsColId, setUimsColId] = useState("")
  const [accountDetails, setAccountDetails] = useState({})
  const [accountEdits, setAccountEdits] = useState({})
  const [accountFields, setAccountFields] = useState([])

  flushHeldKeys()

  useEffect(() => {
    monday.execute("valueCreatedForUser")

    // get the current boardId from Monday then run a query to get all columns from that board
    // then filter those columns by inputtable fields (e.g. text)
    monday.get("context").then(res => {
      const currentBoardId = res.data.boardIds[0]
      // res should be the context for the current board that the user has installed this app in
      setBoardId(currentBoardId);
      const columnsQuery = `query { boards (ids: ${currentBoardId}) { columns { title type id settings_str }}}`

      // query for all columns belonging to this board then filter them based on user-inputtable fields (as defined in const coltypes
      // column query will return an array of objects where each object is a column/field 
      // then convert this array to an object with id:text pairs
      monday.api(columnsQuery).then(res => {
        const columns = res.data.boards[0].columns
        // filter all columns by the columns specified in settings
        const filteredColumns = columns.filter(col => colTypes.has(col.type))
        // filter out subitem columns for mapping
        const subitemsColumn = columns.filter(col => col.id === "subitems")
        // filter out the UIMS column to create incremented names
        const uimsColumn = columns.filter(col => col.title === "UIMS")

        setUimsColId(uimsColumn[0].id)
        getJobNumber(currentBoardId, uimsColumn[0].id, activeUimsLabel)
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

    // if user has inputted a job number, run a query for it
    if (jobNumber) {
      console.log(`Getting ${jobNumber}...`)
      setFetching(true)
      const stringifiedJobNumber = JSON.stringify(jobNumber)
      const jobNumberQuery = `query { items_by_column_values (board_id: ${boardId}, column_id: name, column_value: ${stringifiedJobNumber}) { id column_values { text type title value id } subitems { id name column_values { text type title value id }}}}`

      // query for all column values for the specified job (board item)
      monday.api(jobNumberQuery).then(res => {
        const jobItem = res.data.items_by_column_values[0]
        console.log(jobItem)

        if (jobItem) {
          const { id, subitems, column_values } = jobItem
          const filteredColumns = column_values.filter(col => colTypes.has(col.type))

          setJobId(id)
          setJobNumberValidation({
            text: "",
            status: "success",
          })
          setJobDetails(parseColumns(filteredColumns))

          if (subitems) {
            setSubitems(parseSubitems(subitems))
          }
          else {
            setSubitems(parseSubitemsDefault(subitemFields))
          }

          setFetching(false)
        }
        else {
          throw new Error("This job number doesn't exist!")
        }
      }).catch(error => {
        console.log(error)
        setJobNumberValidation({
          text: "This job number doesn't exist!",
          status: "error",
        })
        setFetching(false)
      });
    }
    // else user has searched while leaving the jobNumber input blank
    else {
      setJobNumberValidation({
        text: "Please enter a job number!",
        status: "error",
      })
    }
  }

  // save new job details or create a new job
  const saveJob = () => {
    // check if we need to create an item in a connected board
    if (connectedBoard.id) {
      console.log(accountEdits)
      const stringifiedItemName = JSON.stringify(connectedBoard.name)
      const mutationString = JSON.stringify(JSON.stringify(accountEdits))
      console.log(mutationString)
      const createItemQuery = `mutation { create_item (board_id: ${connectedBoard.id}, item_name: ${stringifiedItemName}, column_values: ${mutationString}) { id }}`
      const itemsArray = []

      monday.api(createItemQuery).then(res => {
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
    // check if we have a user inputted job number
    if (jobNumber) {
      setSaving(true)

      // if job id exists, we are updating an existing job item
      if (jobId) {
        const updateJob = {
          ...jobEdits,
          name: jobNumber
        }
        // turn newJob into a JSON string so its readable in Monday
        const mutationString = JSON.stringify(JSON.stringify(updateJob))
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
              const stringifiedSubitemName = currentSubitem.column_values.name
              const mutationString = JSON.stringify(JSON.stringify(currentSubitem.column_values))

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
                    resetUims(true)

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
                    resetUims(true)

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
          // almost always the error will be because of an invalid jobNumber
          setJobNumberValidation({
            text: "This job number doesn't exist!",
            status: "error",
          })
          setSaving(false)
        })
      }
      // otherwise create a new job
      else {
        let stringifiedJobNumber = JSON.stringify(jobNumber)
        // this query will check whether current job number already exists
        console.log(`Checking if job number: ${stringifiedJobNumber} exists...`)
        const jobNumberQuery = `query { items_by_column_values(board_id: ${boardId}, column_id: name, column_value: ${stringifiedJobNumber}) { id }}`
        
        monday.api(jobNumberQuery).then(res => {
          const doesJobExist = res.data.items_by_column_values[0]

          if (doesJobExist) {
            console.log(`Job number: ${jobNumber} exists!`)
            // if job number exists, run a query for all items by UIMS label so we can make sure we get the latest number
            const numbersQuery = `query { items_by_column_values(board_id: ${boardId}, column_id: ${uimsColId}, column_value: ${activeUimsLabel}) { name }}`
            console.log("Running a query for most recent job numbers based on UIMS label...")
            monday.api(numbersQuery).then(res => {
              const lastNumber = res.data.items_by_column_values.pop().name
              console.log(`The latest job number was: ${lastNumber}`)
              const newNumber = incrementJobNumber(lastNumber)
              console.log(`The new job number will be: ${newNumber}`)
              setJobNumber(newNumber)
              setNextJobNumber(newNumber)
              return JSON.stringify(newNumber)
            }).then(newJobNumber => {
              const updateJob = {
                ...jobEdits,
                [uimsColId]: { label: activeUimsLabel }
              }
              const mutationString = JSON.stringify(JSON.stringify(updateJob))
              console.log(updateJob)
              const createJobQuery = `mutation { create_item (board_id: ${boardId}, item_name: ${newJobNumber}, column_values: ${mutationString}) { id }}`

              monday.api(createJobQuery).then(res => {
                console.log(`Creating a new item with job number: ${newJobNumber}`)
                console.log(res)
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
                        resetUims(true)

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
                  resetUims(true)

                  return setSaving(false)
                }
              })
            }).catch(error => {
              console.log(error)
              setAppError("Could not process. Please refresh and try again.")
              setSaving(false)
            })
          }
          else {
            console.log(`Did not find ${stringifiedJobNumber}`)
            const updateJob = {
              ...jobEdits,
              [uimsColId]: { label: activeUimsLabel }
            }
            const mutationString = JSON.stringify(JSON.stringify(updateJob))
            const createJobQuery = `mutation { create_item (board_id: ${boardId}, item_name: ${stringifiedJobNumber}, column_values: ${mutationString}) { id }}`

            monday.api(createJobQuery).then(res => {
              console.log(stringifiedJobNumber)
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
                      resetUims(true)

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
                resetUims(true)

                return setSaving(false)
              }
            }).catch(error => {
              console.log(error)
              setAppError("Could not process. Please refresh and try again.")
              setSaving(false)
            })
          }
        })
      }
    }
    else {
      setJobNumberError({
        text: "You must enter a number for this job.",
        status: "error",
      })
    }
  }

  const getJobNumber = (board_id, column_id, column_value) => {
    const namesQuery = `query { items_by_column_values(board_id: ${board_id}, column_id: ${column_id}, column_value: ${column_value}) { name }}`

    // auto populate the name field with an incremented uims label identifier
    monday.api(namesQuery).then(res => {
      const allNames = res.data.items_by_column_values

      if (allNames.length > 0) {
        const lastName = res.data.items_by_column_values.pop().name
        const newNumber = incrementJobNumber(lastName)

        setJobNumber(newNumber)
        setNextJobNumber(newNumber)
      }
      else {
        const currentYear = new Date().getFullYear()
        const newNumber = `${activeUimsLabel}${currentYear}-1`

        setJobNumber(newNumber)
        setNextJobNumber(newNumber)
      }
    })
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

  const handleJobNumber = value => {
    const stringifiedValue = String(value)
    setJobNumberValidation({})
    setAppError("")
    setJobId("")
    setJobNumber(stringifiedValue)
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

  const incrementJobNumber = jobNum => {
    const splitName = jobNum.split('-')
    const newName = `${splitName[0]}-${+splitName[1] + 1}`

    return newName
  }

  const resetUims = reset => {
    setSubitems(parseSubitemsDefault(subitemFields))
    setJobDetails(parseColumnsDefault(columnFields))
    setJobId("")
    setJobNumberValidation({
      text: "",
      status: "",
    })
    
    if (reset) {
      setJobNumber(nextJobNumber)
    }
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
          setBoardRelationField(prevFields => [...prevFields, columns[i]])
          break
        case "date":
          setDateFields(prevFields => [...prevFields, columns[i]])
          break
        case "multiple-person":
          setPeopleFields(prevFields => [...prevFields, columns[i]])
          break
        case "color":
          if (columns[i].title !== "UIMS") {
            setColorFields(prevFields => [...prevFields, columns[i]])
          }
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
          setAccountDetails={setAccountDetails}
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

  const handleUimsLabel = label => {
    setActiveUimsLabel(label)
    getJobNumber(boardId, uimsColId, label)
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
            align={Flex.align.START}
            justify={Flex.justify.START}
          >
            <Flex
              align={Flex.align.START}
              justify={Flex.justify.SPACE_BETWEEN}
            >
              <Box
                border={Box.borders.DEFAULT}
                padding={Box.paddings.NONE}
                className="regular-overflow"
              >
                <Flex
                  gap={16}
                  className="padded-border-bottom"
                >
                  {uimsLabels.map(label => (
                    <div onClick={() => handleUimsLabel(label)}>
                      <RadioButton
                        text={label}
                        checked={label === activeUimsLabel}
                      />
                    </div>
                  ))}
                </Flex>
                <Flex
                  align={Flex.align.START}
                  justify={Flex.justify.START}
                >
                  <Box
                    border={Box.borders.DEFAULT}
                    padding={Box.paddings.NONE}
                    className="already-border-left"
                  >
                    <label
                      className="label-header"
                      htmlFor="job-number"
                    >
                      <span>Job number</span>
                      <span className="text-button">
                        <a onClick={() => resetUims(false)}>
                          Clear
                        </a>
                      </span>
                      <span className="text-button">
                        <a onClick={() => resetUims(true)}>
                          New
                        </a>
                      </span>
                    </label>
                    <Flex
                      align="start"
                    >
                      <TextField
                        id="job-number"
                        value={jobNumber}
                        onChange={handleJobNumber}
                        onKeyDown={e => e.key === "Enter" && getJob()}
                        placeholder="Leave blank to create a new job"
                        iconName={jobNumberValidation.status === "success" && Check}
                        className={jobNumberValidation.status === "success" ? "has-icon-success custom-input-component" : "custom-input-component"}
                        validation={jobNumberValidation}
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
                  <Box
                    border={Box.borders.DEFAULT}
                    padding={Box.paddings.NONE}
                    className="already-border-left regular-overflow"
                  >
                    {boardRelationField.map(field => (
                      <label className="label-header" htmlFor={field.id}>{field.title}</label>
                    ))}
                    {boardRelationField.map(field => (
                      <ColumnField
                        accountFields={accountFields}
                        field={field}
                        jobDetails={jobDetails}
                        jobEdits={jobEdits}
                        monday={monday}
                        setAccountFields={setAccountFields}
                        setAccountDetails={setAccountDetails}
                        setConnectedBoard={setConnectedBoard}
                        setJobDetails={setJobDetails}
                        setJobEdits={setJobEdits}
                      />
                    ))}
                  </Box>
                  <AccountInfo
                    accountDetails={accountDetails}
                    accountEdits={accountEdits}
                    accountFields={accountFields}
                    setAccountEdits={setAccountEdits}
                    setAccountDetails={setAccountDetails}
                  />
                </Flex>
              </Box>
            </Flex>
            <table>
              <thead>
                {textFields.map(field => returnColumnHeaders(field))}
                {dateFields.map(field => returnColumnHeaders(field))}
                {peopleFields.map(field => returnColumnHeaders(field))}
                {colorFields.map(field => returnColumnHeaders(field))}
              </thead>
              <tbody>
                <tr>
                  {textFields.map(field => returnColumnFields(field))}
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
                    <button
                      className="button--table"
                      onClick={() => handleAddSubitemRow()}
                    >
                      Add row
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <Button
              onClick={() => saveJob()}
              loading={saving}
              disabled={fetching || saving}
            >
              {jobNumber ? (
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
