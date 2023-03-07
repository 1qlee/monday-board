import React, { useState, useEffect } from "react";
import { Chips, DialogContentContainer, List, ListItem } from "monday-ui-react-core";

const Status = ({
  changeJobEdits,
  field,
  jobDetails,
}) => {
  const settings = JSON.parse(field.settings_str)
  const { labels } = settings
  const [activeLabel, setActiveLabel] = useState({
    text: "Default",
    style: {
      color: "#d2d2d2"
    }
  })
  const [allLabels, setAllLabels] = useState([])
  const [showList, setShowList] = useState(false)

  useEffect(() => {
    const labelsArray = []

    for (const label in labels) {
      const newLabel = {
        text: labels[label],
        style: settings.labels_colors[label],
        position: settings.labels_positions_v2[label],
        index: label,
      }

      labelsArray.push(newLabel)
    }

    labelsArray.sort((a, b) => a.position - b.position)

    if (jobDetails[field.id].text && jobDetails[field.id].value) {
      const activeLabelIndex = JSON.parse(jobDetails[field.id].value).index

      setActiveLabel({
        text: jobDetails[field.id].text,
        style: settings.labels_colors[activeLabelIndex],
      })
    }
    else {
      setActiveLabel(labelsArray[0])
    }

    setAllLabels(labelsArray)
  }, [field, jobDetails[field.id]])

  const handleChipsClick = (status, label) => {
    if (status.target.children.length > 0) {
      setActiveLabel({
        text: status.target.children[0].innerHTML,
        style: label.style
      })
    }
    else {
      setActiveLabel({
        text: status.target.innerHTML,
        style: label.style
      })
    }

    setShowList(!showList)
    changeJobEdits({ index: label.index })
  }

  return (
    <>
      <Chips
        className="is-active custom-chip-component"
        color={activeLabel.style.color}
        label={activeLabel.text}
        readOnly
        onClick={e => setShowList(!showList)}
      />
      {showList && (
        <DialogContentContainer
          style={{
            position: "absolute",
            zIndex: "999",
          }}
        >
          <List
            dense={true}
          >
            {allLabels.map(label => (
              <Chips
                className={label.text === activeLabel.text ? "is-active custom-chip-component" : "custom-chip-component"}
                color={label.text === activeLabel.text ? label.style.color : "EXPLOSIVE"}
                label={label.text}
                readOnly
                onClick={e => handleChipsClick(e, label)}
              />
            ))}
          </List>
        </DialogContentContainer>
      )}
    </>
  )
}

export default Status