const getHomePage = (req,res) => {
    res.render("index", {
        title: "Accueil",
        message:"Bienvenue sur le site de Mi Amor"
        
    });
}
    
    
    
export default { getHomePage};