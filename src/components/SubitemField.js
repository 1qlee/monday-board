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
    const subitemEditsCopy = subitemEdits
    const { id } = subitem
    if (subitemEdits.length > 0) {
      const findIndex = subitemEditsCopy.findIndex(item => item.id === id)

      if (findIndex) {
        subitemEditsCopy[findIndex].edits = {
          ...subitemEditsCopy[findIndex].edits,
          [field.id]: value,
        }

        setSubitemEdits(subitemEditsCopy)
      }
      else {
        subitemEditsCopy.push({
          [id]: {
            [field.id]: value
          }
        })
      }
    }
    else {
      setSubitemEdits([
        {
          [id]: {
            [field.id]: value
          }
        }
      ])
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
    console.log(editedSubitem)
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