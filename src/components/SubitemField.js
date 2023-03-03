import React from "react";
import { TextField } from "monday-ui-react-core"
import Status from "./Status"
import Calendar from "./Calendar";

const SubitemField = ({
  field,
  subitemDetails,
  subitemEdits,
  setSubitemEdits,
  setSubitemItems,
}) => {

  const changeSubitemEdits = value => {
    setSubitemEdits({
      ...subitemEdits,
      [field.id]: value,
    })
  }

  const changeSubitemDetails = (value, property) => {
    setSubitemItems({
      ...subitemDetails,
      [field.id]: {
        ...subitemDetails[field.id],
        [property]: value,
      },
    })
  }

  return (
    <>
      {field.type === "name" && (
        <TextField
          id={field.id}
          onChange={value => {
            changeSubitemEdits(value)
            changeSubitemDetails(value, "text")
          }}
          value={subitemDetails[field.id].text}
        />
      )}
      {field.type === "text" && (
        <TextField
          id={field.id}
          onChange={value => {
            changeSubitemEdits(value)
            changeSubitemDetails(value, "text")
          }}
          value={subitemDetails[field.id].text}
        />
      )}
      {field.type === "long-text" && (
        <>
          <textarea
            id={field.id}
            rows={3}
            onChange={e => {
              changeSubitemEdits(e.target.value)
              changeSubitemDetails(e.target.value, "text")
            }}
            value={subitemDetails[field.id].text}
          />
        </>
      )}
      {field.type === "numeric" && (
        <TextField
          id={field.id}
          onChange={value => {
            changeSubitemEdits(value)
            changeSubitemDetails(value, "text")
          }}
          value={subitemDetails[field.id].text}
        />
      )}
      {field.type === "color" && (
        <Status
          changeSubitemEdits={changeSubitemEdits}
          field={field}
          subitemDetails={subitemDetails}
        />
      )}
      {field.type === "date" && (
        <Calendar
          field={field}
          subitemDetails={subitemDetails}
        />
      )}
    </>
  )
}

export default SubitemField