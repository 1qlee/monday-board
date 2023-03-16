import React, { useEffect, useState, useCallback, useRef } from "react";
import { Combobox } from "monday-ui-react-core";
import { CloseSmall } from "monday-ui-react-core/icons";

const Accounts = ({
  accountFields,
  changeJobEdits,
  field,
  jobDetails,
  monday,
  setAccountDetails,
  setAccountFields,
  setConnectedBoard,
}) => {
  const [boardItems, setBoardItems] = useState([])
  const [showItems, setShowItems] = useState(false)
  const [loading, setLoading] = useState(true)
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef(null)
  const colTypes = new Set(["text", "long-text"])

  const checkObject = object => {
    return object && object.constructor === Object && Object.keys(object).length > 0
  }

  // function to parse columnFields and get the board ID of the related board from settings_str
  const getAccountBoardId = () => {
    if (field.settings_str) {
      const settings = JSON.parse(field.settings_str)

      if (checkObject(settings)) {
        return settings.boardIds[0]
      }
    }
  }

  const boardId = getAccountBoardId()

  useEffect(() => {
    // on render we will check if we already have some value from Monday populating this connected board field
    if (jobDetails[field.id] && jobDetails[field.id].text) {
      const connectedBoardText = jobDetails[field.id].text

      setInputValue(connectedBoardText)
      checkItemExists(connectedBoardText)
    }
    const accountItemsQuery = `query { boards (ids: ${boardId}) { items { id name column_values { text type title value id }}}}`
    const accountFieldsQuery = `query { boards (ids: ${boardId}) { columns { title type id settings_str }}}`

    monday.api(accountFieldsQuery).then(res => {
      const columns = res.data.boards[0].columns
      const filteredColumns = columns.filter(col => colTypes.has(col.type))

      setAccountFields(filteredColumns)
      setAccountDetails(createAccountDetails(filteredColumns))
    }).then(() => {
      // get all items from this connected board
      monday.api(accountItemsQuery).then(res => {
        if (res.data.boards[0].items.length > 0) {
          const results = res.data.boards[0].items
          const formattedResults = []

          for (let i = 0; i < results.length; i++) {
            const { name, id, column_values } = results[i]

            formattedResults.push({
              id: i,
              label: name,
              itemId: id,
              column_values: column_values,
            })
          }

          setBoardItems(formattedResults)
          setLoading(false)
        }
      })
    }).catch(error => {
      setLoading(false)
    })
  }, [jobDetails[field.id], field])

  const createAccountDetails = (columns, withItem) => {
    const defaultValues = {}

    if (withItem) {
      const { label, column_values } = columns
      const columnsLength = column_values.length

      for (let i = 0; i < columnsLength; i++) {
        defaultValues[column_values[i].id] = column_values[i]
      }

      defaultValues["name"] = label
    }
    else {
      const columnsLength = columns.length

      for (let i = 0; i < columnsLength; i++) {
        defaultValues[columns[i].id] = {
          text: ""
        }
      }
    }

    return defaultValues
  }

  // fires when the filter input changes where value is user input
  const handleFilterChange = useCallback(value => {
    if (value && value.length > 0) {
      setShowItems(true)
      checkItemExists(value)
    }
    else {
      setShowItems(false)
    }
  }, [boardItems])

  // fires when user clicks on an item in the dropdown
  const handleItemSelection = value => {
    setShowItems(false)
    setInputValue(value.label)
    checkItemExists(value.label)
  }

  // check if this item already exists in the connected board
  const checkItemExists = value => {
    // use the user inputted value and check against saved boardItems in state
    // we are doing a string match because item ID is not available from this event handler
    const existingItem = boardItems.find(item => String(item.label) === value)

    if (checkObject(existingItem)) {
      const itemsArray = []
      const { itemId } = existingItem
      itemsArray[0] = +itemId

      changeJobEdits({ item_ids: itemsArray })
      setAccountDetails(createAccountDetails(existingItem, true))
      
      // don't set the board id in connectedBoard
      setConnectedBoard({
        id: null,
        name: "",
        fieldId: "",
      })
    }
    // else set the board id in connectedBoard so we know that we need to create an item in that board
    else {
      setAccountDetails(createAccountDetails(accountFields))
      setConnectedBoard({
        id: boardId,
        name: value,
        fieldId: field.id,
      })
    }
  }

  const handleDummyInputFocus = () => {
    const savedValue = inputValue
    const inputDOM = inputRef.current.children[0].children[0].children[0].children[0].children[0]
    
    setTimeout(() => {
      inputDOM.value = savedValue
      inputDOM.focus()
    }, 1)
    
    setInputValue("")
  }

  const handleDummyInputClose = () => {
    const inputDOM = inputRef.current.children[0].children[0].children[0].children[0].children[0]
    setAccountDetails(createAccountDetails(accountFields))

    setTimeout(() => {
      inputDOM.value = ""
      inputDOM.focus()
    }, 1)

    setInputValue("")
  }

  const handleNoResults = useCallback(() => {
    return;
  })

  return (
    <div className="combobox--wrapper--custom">
      <Combobox
        className={showItems ? "combobox-custom-component" : "is-hidden-combobox"}
        clearFilterOnSelection={false}
        id={field.id}
        loading={loading}
        maxOptionsWithoutScroll={5}
        noResultsRenderer={handleNoResults}
        onClick={handleItemSelection}
        onFilterChanged={handleFilterChange}
        options={boardItems}
        placeholder="Search or create new"
        ref={inputRef}
        renderOnlyVisibleOptions
        size={Combobox.sizes.SMALL}
      />
      <div className={inputValue.length > 0 ? "custom--wrapper--input is-active" : "custom--wrapper--input"}>
        <input
          className={inputValue.length > 0 ? "custom-input-component is-active" : "custom-input-component"}
          id={`combobox--dummy--input`}
          onChange={setInputValue}
          onFocus={handleDummyInputFocus}
          value={inputValue}
        />
        <div 
          className="custom-input-icon--wrapper"
          onClick={() => handleDummyInputClose()}
        >
          <CloseSmall />
        </div>
      </div>
    </div>
  )
}

export default Accounts