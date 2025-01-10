import { useEffect, useRef, useState } from "react";
import { JsonView, allExpanded, darkStyles } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import ChatModal from "../components/ChatModal";
import ShortUniqueId from "short-unique-id";

const uid = new ShortUniqueId({ length: 7 });

const InputComponent = ({ setAnalyzedText, tab, setId }) => {
  const [inputURL, setInputURL] = useState(
    "http://localhost:3000/demo-posts?userid=abc&n=5"
  );

  useEffect(() => {
    const randomID = uid.rnd();

    setInputURL(
      `http://localhost:3000/demo-posts?userid=${randomID}&n=10`
    );
  }, []);

  const [userID, setUserID] = useState("");
  const fileInputRef = useRef(null);

  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    text: "",
  });

  const [isFetching, setIsFetching] = useState(false);

  const [postType, setPostType] = useState("reel");

  const [posts, setPosts] = useState([]);
  const [CSVFile, setCSVFile] = useState("");

  const dummyFileInputClick = (e) => {
    const element = fileInputRef.current;
    element?.click();
  };

  const fetchPosts = async () => {
    if (isFetching) return;

    try {
      const parsedUrl = new URL(inputURL);

      // Extract the userid parameter
      const params = new URLSearchParams(parsedUrl.search);
      const userid = params.get("userid");

      if (!userid) return;
      else {
        setUserID(userid);
        setId(userid);
      }

      setIsFetching(true);

      const response = await fetch(inputURL);

      const data = await response.json();

      setPosts(data.posts);
    } catch (e) {
      console.log(e);
      console.log("Error in fetching posts");
    }

    setIsFetching(false);
  };

  const savePosts = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/put-posts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ posts }),
        }
      );
    } catch (e) {
      console.log("Error in analyzing the data");
    }
  };

  const analyze = async () => {
    try {
      setAnalyzedText({
        isAnalyzing: true,
        data: [],
      });
      const response = await fetch(
        `http://localhost:3000/analyse-posts?userid=${userID}`
      );

      const data = await response.json();
      setAnalyzedText({
        isAnalyzing: false,
        data: data.response.split(","),
      });
    } catch (e) {
      console.log(e);
      console.log("Error in analyzing the data");
      setAnalyzedText({
        isAnalyzing: false,
        data: [],
      });
    }
  };

  const saveAndAnalyze = async () => {
    if (posts.length == 0 || loadingState.isLoading) return;

    setLoadingState({
      isLoading: true,
      text: "Saving...",
    });

    await savePosts();

    setLoadingState({
      isLoading: true,
      text: "Analyzing...",
    });

    await analyze();

    setLoadingState({
      isLoading: false,
      text: "",
    });
  };
  // Function to parse CSV text

  return (
    <div>
      {tab == 0 ? (
        <div className="w-full flex items-center space-x-3">
          <input
            type="text"
            value={inputURL}
            onChange={(e) => {
              setInputURL(e.target.value);
            }}
            className="w-full bg-black py-2 px-3 rounded-md text-white placeholder:text-slate-500 outline-none"
            placeholder="URL"
          />
          <button
            className="bg-white px-4 py-1 rounded-md text-sm"
            onClick={fetchPosts}
          >
            Fetch
          </button>
        </div>
      ) : (
        <div className="w-full">
          <div
            className="flex items-center justify-center py-2 rounded-md space-x-4 w-full bg-white cursor-pointer"
            onClick={dummyFileInputClick}
          >
            <FileUploadRoundedIcon />
            <p className="text-black">Choose a CSV file</p>
          </div>
        </div>
      )}

      <div className="mt-8">
        <div
          className={`bg-black h-72 rounded-lg border  ${
            posts.length == 0
              ? "flex justify-center  items-center"
              : "overflow-y-scroll no-scrollbar"
          }`}
        >
          {isFetching ? (
            <p className=" inline-block text-transparent bg-clip-text">
              Fetching...
            </p>
          ) : posts.length == 0 ? (
            <p className="text-slate-500">No fetched data </p>
          ) : (
            <JsonView
              data={posts}
              shouldExpandNode={allExpanded}
              style={darkStyles}
            />
          )}
        </div>
      </div>

      <div className="flex items-center space-x-5 mt-6">
        <button
          className={`px-8 py-2 rounded-md bg-white text-black flex items-center space-x-3  ${
            posts.length == 0 && "brightness-50 cursor-not-allowed"
          }`}
          onClick={saveAndAnalyze}
        >
          Analyze
        </button>

      </div>
    </div>
  );
};

const Analyse = () => {
  const [currentTab, setCurrentTab] = useState(0);

  const [analyzedText, setAnalyzedText] = useState({
    isAnalyzing: false,
    data: [],
  });
  const [id, setId] = useState("");

  const [isChatModalHidden, setIsChatModalHidden] = useState(true);

  return (
    <div className="h-screen flex flex-1">
      <ChatModal
        isHidden={isChatModalHidden}
        setIsHidden={setIsChatModalHidden}
        userid={id}
      />

      <div className="h-full w-full flex-[0.5] flex items-center justify-center">
        <div className="h-3/4 w-full mt-3 mx-7">
          <p className="text-white text-xl font-medium py-3">
            Get the dummy data by clicking the fetch
          </p>
          <div className="h-full w-full py-1">
            {/* Tabs */}
            <div className="w-full flex items-center space-x-4 mb-2">
              
            </div>
            <div className="h-fit w-full  bg-neutral-900 rounded-md px-4 py-7 shadow-[0px_45px_97px_-46px_#7075ff62]">
              {/* URL input component */}

              <InputComponent
                setAnalyzedText={setAnalyzedText}
                tab={currentTab}
                setId={setId}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="h-full flex-[0.5] flex items-center justify-center px-10 leading-7">
        {analyzedText.data.length != 0 ? (
          <div className="text-white leading-8">
            {analyzedText.data.map((insight) => (
              <p>- {insight}</p>
            ))}
          </div>
        ) : (
          <div className="text-white">
            {analyzedText.isAnalyzing ? (
              <p>Analyzing...</p>
            ) : (
              <p>No analysis</p>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default Analyse;
