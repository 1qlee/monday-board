import React, { useEffect, useState, useCallback, useRef } from "react"
import { Combobox } from "monday-ui-react-core"

const BoardRelation = ({
  changeField,
  connectedBoard,
  field,
  monday,
  setConnectedBoard,
}) => {
  const [boardItems, setBoardItems] = useState([])
  const [showItems, setShowItems] = useState(false)
  const [loading, setLoading] = useState(true)
  const inputRef = useRef(null)

  const checkObject = object => {
    return object && object.constructor === Object && Object.keys(object).length > 0
  }

  useEffect(() => {
    // function to parse columnFields and get the board ID of the related board from settings_str
    const getRelatedBoardId = () => {
      if (field.settings_str) {
        const settings = JSON.parse(field.settings_str)

        if (checkObject(settings)) {
          return settings.boardIds[0]
        }
      }
      else {
        console.log("NO settings_str found")
      }
    }
  
    // get all items from this connected board
    monday.api(`query { boards (ids: ${getRelatedBoardId()}) { items { id name column_values { text type title value id }}}}`).then(res => {
      console.log(res)
      setLoading(false)
      if (res.data.boards[0].items.length > 0) {
        const results = res.data.boards[0].items
        const formattedResults = []

        for (let i = 0; i < results.length; i++) {
          const { name, id, type } = results[i]

          formattedResults.push({
            id: i,
            label: name,
            itemId: id,
            type: type,
          })
        }

        setBoardItems(formattedResults)
      }
    }).catch(error => {
      console.log(error)
    })
  }, [field])

  // fires when the filter input changes where value is user input
  const handleFilterChange = useCallback(value => {
    if (value && value.length > 0) {
      setShowItems(true)
      const existingItem = boardItems.find(item => String(item.label) === value)

      // check if this item already exists in the related board using the input value to check (doesn't work for non-unique names)
      if (checkObject(existingItem)) {
        console.log("Item exists: ", existingItem)
        const itemsArray = []
        const { itemId } = existingItem
        itemsArray[0] = itemId

        changeField(itemsArray, "item_ids")
        setConnectedBoard({
          ...connectedBoard,
          itemExists: true,
        })
      }
      // else flag that the item doesn't exist in app's state so that we can create it
      else {
        setConnectedBoard({
          ...connectedBoard,
          itemExists: false,
        })
      }
    }
    else {
      setShowItems(false)
    }
  }, [boardItems])

  // fires when user clicks on an item in the dropdown
  const handleItemSelection = value => {
    // force async because the value takes some time to come for some reason and await doesn't seem to work
    setTimeout(() => {
      // change the input through useRef children
      inputRef.current.children[0].children[0].children[0].children[0].children[0].value = value.label
      setShowItems(false)
    }, 10)
  }

  const handleNoResults = useCallback(() => {
    return;
  })

  return (
    <Combobox
      className={showItems ? null : "is-hidden-combobox"}
      maxOptionsWithoutScroll={4}
      loading={loading}
      id={field.id}
      options={boardItems}
      onClick={handleItemSelection}
      onFilterChanged={handleFilterChange}
      placeholder="Search or create new"
      renderOnlyVisibleOptions
      noResultsRenderer={handleNoResults}
      ref={inputRef}
      size={Combobox.sizes.SMALL}
    />
  )
}

export default BoardRelation