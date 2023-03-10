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
    const editsExist = subitemEdits.length > 0
    // subitem will have an id only when a job has subitems already
    if (subitem.id) {
      const { id } = subitem
      const subitemId = id.text
      const newSubitem = {
        id: subitemId,
        column_values: {
          [field.id]: value
        }
      }

      // first check if subitemEdits has subitems already
      if (editsExist) {
        // make a copy of the subitemEdits array
        const subitemEditsCopy = subitemEdits
        // check if this subitem already has edits
        const subitemIndex = subitemEditsCopy.findIndex(item => item.id === subitemId)

        // if the subitem already exist, change the targeted field's value
        if (subitemIndex >= 0) {
          subitemEditsCopy[subitemIndex].column_values[field.id] = value
        }
        else {
          subitemEditsCopy[subitemEditsCopy.length] = newSubitem
        }

        setSubitemEdits(subitemEditsCopy)
      }
      else {
        const subitemEditsNew = []
        subitemEditsNew[0] = newSubitem
        setSubitemEdits(subitemEditsNew)
      }
    }
    // otherwise we don't need a subitem id to create new subitems from scratch
    else {
      const subitemEditsCopy = subitemEdits

      if (editsExist) {
        if (subitemEditsCopy[index]) {
          subitemEditsCopy[index].column_values[field.id] = value
        }
        else {
          subitemEditsCopy[index] = {
            column_values: {
              [field.id]: value
            }
          }
        }
      }
      else {
        subitemEditsCopy[index] = {
          column_values: {
            [field.id]: value
          }
        }
      }

      setSubitemEdits(subitemEditsCopy)
    }
  }

  const changeSubitems = (value, property) => {
    const subitemsCopy = subitems
    const subitemToEdit = subitemsCopy[index]
    subitemToEdit[field.id] = {
      ...subitemToEdit[field.id],
      [property]: value
    }
    subitemsCopy[index] = subitemToEdit

    setSubitems(subitemsCopy)
  }

  return (
    <>
      {field.type === "name" && (
        <TextField
          autoComplete="off"
          className="custom-input-component--table"
          onChange={value => {
            changeSubitemEdits(value)
            changeSubitems(value, "text")
          }}
          value={subitem[field.id].text}
        />
      )}
      {field.type === "text" && (
        <TextField
          autoComplete="off"
          className="custom-input-component--table"
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
          autoComplete="off"
          className="custom-input-component--table"
          onChange={value => {
            changeSubitemEdits(value)
            changeSubitems(value, "text")
          }}
          value={subitem[field.id].text}
        />
      )}
      {field.type === "color" && (
        <Status
          changeJobEdits={changeSubitemEdits}
          field={field}
          jobDetails={subitem}
        />
      )}
      {field.type === "date" && (
        <Calendar
          className="button--table"
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