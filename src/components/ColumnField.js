import React, { useMemo, useCallback } from "react";
import { TextField, Label, Dropdown } from "monday-ui-react-core"
import BoardRelation from "./BoardRelation";

const ColumnField = ({ 
  field, 
  jobDetails, 
  monday,
  setJobDetails,
}) => {

  const changeField = (value, property) => {
    setJobDetails({
      ...jobDetails,
      [field.id]: {
        [property]: value,
      },
    })
  }

  return (
    <>
      {field.type === "text" && (
        <TextField
          id={field.id}
        />
      )}
      {field.type === "board-relation" && (
        <BoardRelation 
          changeField={changeField}
          field={field}
          monday={monday}
          jobDetails={jobDetails}
          setJobDetails={setJobDetails}
        />
      )}
      {field.type === "long-text" && (
        <textarea
          id={field.id}
        />
      )}
      {field.type === "numeric" && (
        <TextField 
          id={field.id}
        />
      )}
    </>
  )
}

export default ColumnField;