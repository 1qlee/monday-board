import React, { useState } from "react";
import { DatePicker, Button } from "monday-ui-react-core"
import { format, parseISO } from 'date-fns'

const Calendar = ({
  field,
  jobDetails,
  changeJobDetails,
  changeJobEdits,
}) => {
  const [showPicker, setShowPicker] = useState(false)

  const handlePickDate = date => {
    const newDate = format(new Date(date._d), "yyyy-MM-dd")

    changeJobEdits(newDate)
    changeJobDetails(date, "date")
    changeJobDetails(newDate, "text")
    setShowPicker(!showPicker)
  }

  const handleButtonText = () => {
    if (jobDetails[field.id].text) {
      return format(parseISO(jobDetails[field.id].text), "MM/dd/yyyy")
    }
    else {
      return "Select date"
    }
  }

  return (
    <>
      <Button
        kind="secondary"
        size="small"
        onClick={() => setShowPicker(!showPicker)}
      >
        {handleButtonText()}
      </Button>
      {showPicker && (
        <DatePicker
          className="date-picker-component"
          date={jobDetails[field.id].date}
          onPickDate={d => handlePickDate(d)}
        />
      )}
    </>
  )
}

export default Calendar