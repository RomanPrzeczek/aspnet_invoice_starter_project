import {useEffect, useState} from "react";

import { useAuth } from "../auth/AuthContext";

import {apiDelete, apiGet} from "../utils/api";

import PersonTable from "./PersonTable";

const PersonIndex = () => {
    const {token} = useAuth();
    const [persons, setPersons] = useState([]);

    const deletePerson = async (id) => {
        try {
            await apiDelete("/api/persons/" + id, token);
        } catch (error) {
            console.log(error.message);
            alert(error.message)
        }
        setPersons(persons.filter((item) => item._id !== id));
    };

    useEffect(() => {
        apiGet("/api/persons").then((data) => setPersons(data));
    }, []);

    return (
        <div>
            <h1>Seznam osob</h1>
            <PersonTable
                deletePerson={deletePerson}
                items={persons}
                label="Počet osob:"
            />
        </div>
    );
};
export default PersonIndex;
