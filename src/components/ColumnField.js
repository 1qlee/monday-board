import React from "react";
import { TextField } from "monday-ui-react-core"
import Accounts from "./Accounts";
import Status from "./Status"
import Calendar from "./Calendar";
import People from "./People";

const ColumnField = ({ 
  field, 
  jobDetails, 
  jobEdits,
  monday,
  setAccountDetails,
  setConnectedBoard,
  setJobDetails,
  setJobEdits,
}) => {

  const changeJobEdits = value => {
    setJobEdits({
      ...jobEdits,
      [field.id]: value,
    })
  }

  const changeJobDetails = (value, property) => {
    setJobDetails({
      ...jobDetails,
      [field.id]: {
        ...jobDetails[field.id],
        [property]: value,
      },
    })
  }

  return (
    <>
      {field.type === "text" && (
        <TextField
          className="custom-input-component--table"
          id={field.id}
          onChange={value => {
            changeJobEdits(value)
            changeJobDetails(value, "text")
          }}
          value={jobDetails[field.id].text}
        />
      )}
      {field.type === "board-relation" && (
        <Accounts 
          changeJobEdits={changeJobEdits}
          field={field}
          jobDetails={jobDetails}
          setAccountDetails={setAccountDetails}
          monday={monday} 
          setConnectedBoard={setConnectedBoard}
        />
      )}
      {field.type === "long-text" && (
        <>
          <textarea
            id={field.id}
            rows={3}
            onChange={e => {
              changeJobEdits(e.target.value)
              changeJobDetails(e.target.value, "text")
            }}
            value={jobDetails[field.id].text}
          />
        </>
      )}
      {field.type === "numeric" && (
        <TextField 
          className="custom-input-component--table"
          id={field.id}
          onChange={value => {
            changeJobEdits(value)
            changeJobDetails(value, "text")
          }}
          value={jobDetails[field.id].text}
        />
      )}
      {field.type === "color" && (
        <Status 
          changeJobEdits={changeJobEdits}
          field={field}
          jobDetails={jobDetails}
        />
      )}
      {field.type === "date" && (
        <Calendar
          className="button--table"
          changeJobDetails={changeJobDetails}
          changeJobEdits={changeJobEdits}
          field={field}
          jobDetails={jobDetails}
        />
      )}
      {field.type === "multiple-person" && (
        <People 
          changeJobEdits={changeJobEdits}
          field={field}
          jobDetails={jobDetails}
          monday={monday}
        />
      )}
    </>
  )
}

export default ColumnField;