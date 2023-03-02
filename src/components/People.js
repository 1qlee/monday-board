import React, { useState, useEffect } from "react";
import { List, ListItem, ListTitle, Avatar, DialogContentContainer, Loader } from "monday-ui-react-core"

const People = ({
  monday,
  field,
}) => {
  const [users, setUsers] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    monday.api(`query { users { id name photo_thumb_small } teams { id name picture_url }}`).then(res => {
      const { data } = res

      setUsers(data.users)
      setTeams(data.teams)
      setLoading(false)
    }).catch(error => {
      console.log(error)
      setLoading(false)
    })
  }, [field])

  return (
    <DialogContentContainer
      style={{
        height: "204px"
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
  )
}

export default People