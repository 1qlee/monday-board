import React, { useState, useEffect } from "react"
import ColumnField from "./ColumnField"

const Subitems = ({
  boardId,
  colTypes,
  monday
}) => {
  const [columnFields, setColumnFields] = useState([])
  const [subitemEdits, setSubitemEdits] = useState({})
  const [subitemDetails, setSubitemDetails] = useState({})

  useEffect(() => {
    if (boardId) {
      const columnsQuery = `query { boards (ids: ${boardId}) { columns { title type id settings_str }}}`
      monday.api(columnsQuery).then(res => {
        const columns = res.data.boards[0].columns
        const filteredColumns = columns.filter(col => colTypes.has(col.type))

        setColumnFields(filteredColumns)
      })
    }
  }, [boardId])

  return (
    <div>
      {columnFields.map(field => (
        <>
          <label htmlFor={field.id}>{field.title}</label>
          <ColumnField
            field={field}
            jobDetails={subitemDetails}
            jobEdits={subitemEdits}
            monday={monday}
            setJobDetails={setSubitemDetails}
            setJobEdits={setSubitemEdits}
          />
        </>
      ))}
    </div>
  )
}

export default Subitems