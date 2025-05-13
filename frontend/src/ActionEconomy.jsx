import { useState } from "react";
import actions from "./data/actions.json";
import halfActions from "./data/halfActions.json";
import background from "./assets/Images/4060492.jpg";
import Footer from "./components/Footer";
import ActionCard from "./components/Rulebook/ActionCard";

const ActionEconomyPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredActions = actions.filter((action) => {
    const query = searchQuery.toLowerCase();
    return (
      action.name.toLowerCase().includes(query) ||
      action.type.toLowerCase().includes(query)
    );
  });

  const filteredHalfActions = halfActions.filter((action) => {
    const query = searchQuery.toLowerCase();
    return (
      action.name.toLowerCase().includes(query) ||
      action.type.toLowerCase().includes(query)
    );
  });

  return (
    <div
      className="bg-repeat bg-[length:1920px_1080px] w-screen min-h-screen text-white justify-center"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className="py-10"> </div>
      <div className="min-h-screen text-white p-6 font-mono">
        <div className="flex gap-4 mb-6 justify-center">
          <h1 className="text-3xl font-bold mb-4">Action Economy</h1>
        </div>
        <div className="flex gap-4 mb-6 justify-center">
          <h1 className="text-xl">Per turn:</h1>
        </div>

        <div className="flex gap-4 mb-6 justify-center">
          <div className="bg-orange-500 p-4 rounded-md text-center">
            <p className="">Full Action</p>
          </div>
          <div className="bg-orange-300 p-4 rounded-md text-center">
            <p className="">Half Action</p>
          </div>
          <div className="bg-orange-300 p-4 rounded-md text-center">
            <p className="">Half Action</p>
          </div>
        </div>

        <div className="flex gap-4 mb-6 justify-center">
          <input
            type="text"
            placeholder="Search actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-6 p-2 rounded bg-gray-800 text-white border border-orange-400 w-full max-w-md"
          />
        </div>

        {filteredActions.length > 0 && (
          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink mx-4 text-gray-100">Full Actions</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-screen-lg mx-auto">
          {filteredActions.map((action, id) => (
            <ActionCard key={id} action={action} />
          ))}
        </div>


        {filteredHalfActions.length > 0 && (
          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink mx-4 text-gray-100">Half Actions</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-screen-lg mx-auto">
          {filteredHalfActions.map((action, id) => (
            <ActionCard key={id} action={action} />
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ActionEconomyPage;
