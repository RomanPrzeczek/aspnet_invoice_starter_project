

import {Link} from "react-router-dom";
import PropTypes from "prop-types";
import { useAuth } from "../auth/AuthContext";

const PersonTable = ({label, items, deletePerson}) => {
    const {isAdmin, user} = useAuth();
    return (
        <div>
            <p>
                {label} {items.length}
            </p>

            <table className="table table-bordered">
                <thead>
                <tr>
                    <th>#</th>
                    <th>Jméno</th>
                    <th colSpan={3}>Akce</th>
                </tr>
                </thead>
                <tbody>
                {items.map((item, index) => (
                    <tr key={index + 1}>
                        <td>{index + 1}</td>
                        <td>{item.name}</td>
                        <td>
                            <div className="btn-group">
                                {(isAdmin || user?._id === item.identityUserId)&&(
                                <>
                                <Link
                                    to={"/persons/show/" + item._id}
                                    className="btn btn-sm btn-info"
                                >
                                    Zobrazit
                                </Link>
                                <Link
                                    to={"/persons/edit/" + item._id}
                                    className="btn btn-sm btn-warning"
                                >
                                    Upravit
                                </Link>
                                </>
                                )}
                                {isAdmin && (
                                <button
                                    onClick={() => deletePerson(item._id)}
                                    className="btn btn-sm btn-danger"
                                >
                                    Odstranit
                                </button>
                                )}
                            </div>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
            {isAdmin && (
            <Link to={"/persons/create"} className="btn btn-success">
                Nová osoba
            </Link>
            )}
        </div>
    );
};

PersonTable.propTypes = {
    label: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(
        PropTypes.shape({
            _id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
            name: PropTypes.string.isRequired,
        })
    ).isRequired,
    deletePerson: PropTypes.func.isRequired,
};

export default PersonTable;
