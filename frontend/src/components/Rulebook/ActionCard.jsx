
const ActionCard = ({ action }) => {
    return(
  <div className={`rounded-md p-4 text-white ${action.color} border-1`}>
    <h3 className="font-bold text-lg flex items-center gap-2">
      <img src={action.icon} className="w-10 h-10"></img>{" "}
      {action.name.toUpperCase()}
    </h3>
    <p className="text-sm mt-2 whitespace-pre-line">{action.description}</p>
  </div>
);
};

export default ActionCard