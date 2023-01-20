import React, { useEffect, useState, useCallback, useRef } from "react"
import { Combobox } from "monday-ui-react-core"

const BoardRelation = ({
  changeField,
  field,
  monday,
}) => {
  const [relatedBoardId, setRelatedBoardId] = useState("")
  const [boardItems, setBoardItems] = useState([])
  const [showItems, setShowItems] = useState(false)
  const [loading, setLoading] = useState(true)
  const inputRef = useRef(null)

  useEffect(() => {
    // function to parse columnFields and get the board ID of the related board from settings_str
    const getRelatedBoardId = () => {
      if (field.settings_str) {
        const settings = JSON.parse(field.settings_str)
        console.log(settings)

        if (settings && Object.keys(settings).length > 0 && settings.constructor === Object) {
          setRelatedBoardId(settings.boardIds[0])
        }
      }
      else {
        console.log("NO settings_str found")
      }
    }
  
    getRelatedBoardId()
    // get all items from this connected board
    monday.api(`query { boards (ids: ${relatedBoardId}) { items { id name column_values { text type title value id }}}}`).then(res => {
      console.log(res)
      setLoading(false)
      if (res.data.boards[0].items.length > 0) {
        const results = res.data.boards[0].items
        const formattedResults = []

        for (let i = 0; i < results.length; i++) {
          const { name, id } = results[i]

          formattedResults.push({
            id: i,
            label: name,
            itemId: id,
          })
        }

        setBoardItems(formattedResults)
      }
    }).catch(error => {
      console.log(error)
    })
  }, [field, inputRef])

  // fires when the filter input changes
  const handleFilterChange = value => {
    if (value && value.length > 0) {
      setShowItems(true)
    }
    else {
      setShowItems(false)
    }

    changeField(value, "value")
  }

  // fires when user clicks on an item in the dropdown
  const handleItemSelection = async value => {
    const itemValue = await value

    // force async because the value takes some time to come for some reason and await doesn't seem to work
    setTimeout(() => {
      // change the input through useRef children
      inputRef.current.children[0].children[0].children[0].children[0].children[0].value = itemValue.label
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