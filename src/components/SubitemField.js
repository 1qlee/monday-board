import React from "react";
import { TextField } from "monday-ui-react-core"
import Status from "./Status"
import Calendar from "./Calendar";

const SubitemField = ({
  field,
  index,
  subitem,
  subitems,
  subitemEdits,
  setSubitemEdits,
  setSubitems,
}) => {

  const changeSubitemEdits = value => {
    const { id } = subitem
    const newSubitem = {
      id: id,
      column_values: {
        [field.id]: value
      }
    }

    // first check if subitemEdits has subitems already
    if (subitemEdits.length > 0) {
      // make a copy of the subitemEdits array
      const subitemEditsCopy = subitemEdits
      // check if this subitem already has edits
      const subitemIndex = subitemEditsCopy.findIndex(edit => edit.id === id)

      // if the subitem already exist, change the targeted field's value
      if (subitemIndex) {
        subitemEditsCopy[subitemIndex].column_values[field.id] = value
      }
      else {
        subitemEditsCopy.push(newSubitem)
      }

      setSubitemEdits(subitemEditsCopy)
    }
    else {
      const subitemEditsNew = []
      subitemEditsNew[0] = newSubitem
      setSubitemEdits(subitemEditsNew)
    }
  }

  const changeSubitems = (value, property) => {
    const editedSubitem = {
      ...subitem,
      [field.id]: {
        ...subitem[field.id],
        [property]: value,
      }
    }

    const editedSubitems = subitems
    editedSubitems[index] = editedSubitem

    setSubitems(editedSubitems)
  }

  return (
    <>
      {field.type === "name" && (
        <TextField
          id={field.id}
          onChange={value => {
            changeSubitemEdits(value)
            changeSubitems(value, "text")
          }}
          value={subitem[field.id].text}
        />
      )}
      {field.type === "text" && (
        <TextField
          id={field.id}
          onChange={value => {
            changeSubitemEdits(value)
            changeSubitems(value, "text")
          }}
          value={subitem[field.id].text}
        />
      )}
      {field.type === "long-text" && (
        <>
          <textarea
            id={field.id}
            rows={3}
            onChange={e => {
              changeSubitemEdits(e.target.value)
              changeSubitems(e.target.value, "text")
            }}
            value={subitem[field.id].text}
          />
        </>
      )}
      {field.type === "numeric" && (
        <TextField
          id={field.id}
          onChange={value => {
            changeSubitemEdits(value)
            changeSubitems(value, "text")
          }}
          value={subitem[field.id].text}
        />
      )}
      {field.type === "color" && (
        <Status
          changeSubitemEdits={changeSubitemEdits}
          field={field}
          jobDetails={subitem}
        />
      )}
      {field.type === "date" && (
        <Calendar
          field={field}
          jobDetails={subitem}
          changeJobDetails={changeSubitems}
          changeJobEdits={changeSubitemEdits}
        />
      )}
    </>
  )
}

export default SubitemField