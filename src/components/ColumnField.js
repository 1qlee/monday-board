import React from "react";
import { TextField } from "monday-ui-react-core"
import BoardRelation from "./BoardRelation";
import Status from "./Status"
import Calendar from "./Calendar";
import People from "./People";

const ColumnField = ({ 
  field, 
  jobDetails, 
  jobEdits,
  monday,
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
          id={field.id}
          onChange={value => {
            changeJobEdits(value)
            changeJobDetails(value, "text")
          }}
          value={jobDetails[field.id].text}
        />
      )}
      {field.type === "board-relation" && (
        <BoardRelation 
          changeJobEdits={changeJobEdits}
          field={field}
          jobDetails={jobDetails}
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