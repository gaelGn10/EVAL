import { motion } from "motion/react";

const Transition = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.2,
        ease: "easeInOut",
      }}
      className="h-full w-full flex-1"
    >
      {children}
    </motion.div>
  );
};

export default Transition;
