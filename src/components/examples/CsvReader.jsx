import { useState } from "react";
import Papa from "papaparse";

const CsvReader = ({ onRead, header = true }) => {
    const [csvData, setCsvData] = useState([]);
    const [file, setFile] = useState(null);

    const handleRead = (event) => {
        if (!file) {
            alert("My friend, I need file");
            return;
        }
        Papa.parse(file, {
            header: header, // maka ligne voloany -> avadiny indice ho an'ny ambony rehetra
            skipEmptyLines: true,
            delimiter: null,
            complete: (results) => {
                onRead(results);
            },
        });
    };

    const handleChangeFile = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    }

    return (
        <div className="flex items-center gap-4 w-fit">
            <input onChange={handleChangeFile} type="file" accept=".csv" className="file-input file-input-sm" />
            <button onClick={handleRead} className="btn btn-sm btn-neutral">read</button>
        </div>
    )
}

export default CsvReader;