import React, { useState, useEffect } from "react"
import ColumnField from "./ColumnField"
import { Flex } from "monday-ui-react-core"

const Subitems = ({
  subitemDetails,
  subitemFields,
  setSubitemDetails,
}) => {
  const [subitemEdits, setSubitemEdits] = useState({})

  return (
    <>
      {subitemDetails.map(subitem => (
        <Flex>
          {subitemFields.map(field => (
            <fieldset>
              <label htmlFor={field.id}>{field.title}</label>
              <ColumnField
                field={field}
                jobDetails={subitem}
                jobEdits={subitemEdits}
                setJobDetails={setSubitemDetails}
                setJobEdits={setSubitemEdits}
              />
            </fieldset>
          ))}
        </Flex>
      ))}
    </>
  )
}

export default Subitems