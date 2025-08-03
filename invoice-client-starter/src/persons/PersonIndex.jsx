import {useEffect, useState} from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from "../auth/AuthContext";
import {apiDelete, apiGet} from "../utils/api";
import PersonTable from "./PersonTable";

const PersonIndex = () => {
    const {t} = useTranslation();
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
            <h1> {t('PeoplesList')} </h1>
            <PersonTable
                deletePerson={deletePerson}
                items={persons}
                label={t('PeoplesCount')+": "} 
            />
        </div>
    );
};
export default PersonIndex;
