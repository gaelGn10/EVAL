import { useParams } from "react-router-dom";
import { UsersProvider } from "../../components/users/UsersContext";
import UserDetailContent from "../../components/users/UserDetailContent";

const UserDetail = () => {
    const { id } = useParams();
    return (
        <UsersProvider userId={id}>
            <UserDetailContent />
        </UsersProvider>
    );
};

export default UserDetail;
