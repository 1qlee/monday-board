import React, { useState, useEffect } from "react";
import { Button, List, ListItem, ListTitle, Avatar, DialogContentContainer, Loader } from "monday-ui-react-core"

const People = ({
  monday,
  field,
  jobDetails,
}) => {
  const [showList, setShowList] = useState(false)
  const [activePerson, setActivePerson] = useState({
    name: "Select person",
    src: "",
  })
  const [users, setUsers] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    monday.api(`query { users { id name photo_thumb_small } teams { id name picture_url }}`).then(res => {
      const { data } = res

      setUsers(data.users)
      setTeams(data.teams)

      if (jobDetails[field.id].value) {
        const activePersonObj = JSON.parse(jobDetails[field.id].value).personsAndTeams[0]
        const activePersonId = activePersonObj.id
        const activePersonType = activePersonObj.kind
        let activePerson;

        if (activePersonType === "person") {
          activePerson = users.find(user => user.id === activePersonId)
        }
        if (activePersonType === "team") {
          activePerson = teams.find(team => team.id === activePersonId)
        }

        return activePerson
      }
      else {
        return { name: "Select person" }
      }

      setLoading(false)
    }).catch(error => {
      console.log(error)
      setLoading(false)
    })
  }, [field, jobDetails])

  return (
    <>
      {showList ? (
        <DialogContentContainer
          style={{
            height: "205px"
          }}
        >
          <List
            dense={true}
          >
            {loading ? (
              <Loader
                color="primary"
                size="small"
              />
            ) : (
              <>
                <ListTitle>
                  Users
                </ListTitle>
                {users.map(user => (
                  <ListItem key={user.id} size={ListItem.sizes.XXS}>
                    <Avatar className="list-item-avatar" src={user.photo_thumb_small} size="small" type="img" />
                    {user.name}
                  </ListItem>
                ))}
                <ListTitle>
                  Teams
                </ListTitle>
                {teams.map(team => (
                  <ListItem key={team.id} size={ListItem.sizes.XXS}>
                    <Avatar className="list-item-avatar" src={team.picture_url} size="small" type="img" />
                    {team.name}
                  </ListItem>
                ))}
              </>
            )}
          </List>
        </DialogContentContainer>
      ) : (
        <Button
          kind="secondary"
          size="small"
          onClick={() => setShowList(!showList)}
        >
          {handleActivePerson()}
        </Button>
      )}    
    </>
  )
}

export default People