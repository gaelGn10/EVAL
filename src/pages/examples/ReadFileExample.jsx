import { useState } from "react";
import Papa from "papaparse";
import CsvReader from "../../components/examples/CsvReader";
import XlsxReader from "../../components/examples/XlsxReader";
import JsonView from "@uiw/react-json-view";

const ReadFileExample = () => {

    const [fileData, setFileData] = useState({});

    const handleRead = (data) => {
        console.log(data);
        setFileData(data);
    }

    return (
        <div className="flex justify-between px-4 py-2 gap-4">

            <div className="flex flex-col gap-4 w-xl">
                <div className="flex flex-col">
                    <div className="flex">csv</div>
                    <CsvReader onRead={handleRead} sheet={'item'} />
                </div>
                <div className="flex flex-col">
                    <div className="flex">xslx</div>
                    <XlsxReader onRead={handleRead} />
                </div>
            </div>

            <div className="flex flex-col w-6xl py-4 px-4">
                <JsonView value={fileData} />
            </div>

        </div>
    )
}

export default ReadFileExample;