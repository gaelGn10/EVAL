import { UsersProvider } from "../../components/users/UsersContext";
import UserListContent from "../../components/users/UserListContent";

const UserList = () => {
  return (
    <UsersProvider>
      <UserListContent />
    </UsersProvider>
  );
};

export default UserList;
