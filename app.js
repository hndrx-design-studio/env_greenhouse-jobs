const ghSlug = "envoy"; 

// Global variables defined here
const departmentIds = [];
let uniqueLocations = new Set();
const root = document.getElementById("root");
const loading = document.getElementById("loading");
const jobFilter = document.getElementById("filter-jobs");
const locationFilter = document.getElementById("filter-locations");
const dateFilter = document.getElementById("filter-date");
const errorWrapper = document.getElementById("errwrapper");
const errorText = document.getElementById("errtext");


function applyFilters() {
    let selectedSection = jobFilter.value;
    let selectedLocation = locationFilter.value;

    // First, reset all department sections and job listings to be visible
    let allDepartments = document.querySelectorAll(".department-section");
    let allJobs = document.querySelectorAll(".job-listing");
    allDepartments.forEach((dept) => dept.style.display = "block");
    allJobs.forEach((job) => job.style.display = "flex");

    // Filter by department
    if (selectedSection !== "all") {
        allDepartments.forEach((dept) => {
            if (dept.id !== selectedSection) {
                dept.style.display = "none";
            }
        });
    }

    // Filter by location
    allJobs.forEach((job) => {
        if (job.getElementsByClassName("job-location")[0].innerText !== selectedLocation && selectedLocation !== "all") {
            job.style.display = "none";
        }
    });

    // Filter by date
    let currentDate = new Date();
    allJobs.forEach((job) => {
        let jobDate = new Date(job.getAttribute("data-updated-at"));
        console.log(`currentDate: ${currentDate}`);
        console.log(`jobDate: ${jobDate}`);
        let timeDiff = currentDate - jobDate;
        let daysDiff = timeDiff / (1000 * 60 * 60 * 24);
        console.log(`daysDiff: ${daysDiff}`);

        console.log(`dateFilter: ${dateFilter.value}`);

        switch (dateFilter.value) {
            case "last-week":
                if (daysDiff > 7) {
                    job.style.display = "none";
                }
                break;
            case "past-24-hours":
                if (daysDiff > 1) {
                    job.style.display = "none";
                }
                break;
            default:
                break;
        }
    });

    // Hide departments that don't have any visible job listings after applying both filters
    allDepartments.forEach((department) => {
        let visibleJobsInDepartment = department.querySelectorAll(".job-listing:not([style='display: none;'])");
        if (visibleJobsInDepartment.length === 0) {
            department.style.display = "none";
        }
    });

    // Check if any departments are visible after filtering
    let visibleDepartments = document.querySelectorAll(".department-section:not([style='display: none;'])");
    let noJobsMessage = document.getElementById("noJobsMessage");
    if (visibleDepartments.length === 0) {
        noJobsMessage.style.display = "block";
    } else {
        noJobsMessage.style.display = "none";
    }


 }

jobFilter.onchange = applyFilters;
locationFilter.onchange = applyFilters;
dateFilter.onchange = applyFilters;


// Triggers when the DOM is ready
window.addEventListener("DOMContentLoaded", (event) => {
    const handleError = (response) => {
        if (!response.ok) {
        throw Error(` ${response.status} ${response.statusText}`);
        } else {
        return response.json();
        }
    };
    fetch(
        "https://boards-api.greenhouse.io/v1/boards/" + ghSlug + "/departments/"
    )
        .then(handleError)
        .then((data) => {
        data.departments.forEach((department) => {
            department.jobs.forEach((job) => {
                uniqueLocations.add(job.location.name);
            });
            
            if (department.jobs.length !== 0) {
            departmentIds.push(department.id);
            let sectionWrapper = document.getElementById("section");
            let sectionClone = sectionWrapper.cloneNode(true);
            sectionClone.id = department.id;
            root.appendChild(sectionClone);
            let option = document.createElement("option");
            option.text = department.name;
            option.value = department.id;
            jobFilter.add(option);
            } else {
            null;
            }
            
        });
        console.log(uniqueLocations);
        // Populate the filter-locations dropdown with the unique locations
        uniqueLocations.forEach((location) => {
            let option = document.createElement("option");
            option.text = location;
            option.value = location;
            locationFilter.add(option);
        });
    })
    .catch(function writeError(err) {
        console.error(err);
    })
    .finally(() => {
        writeJobs();
    });
});
// Triggered in finally above
function writeJobs() {
    departmentIds.forEach((departmentId) => {
        const handleError = (response) => {
        if (!response.ok) {
            throw Error(` ${response.status} ${response.statusText}`);
        } else {
            return response.json();
        }
        };
        fetch(
        "https://boards-api.greenhouse.io/v1/boards/" + ghSlug + "/departments/" + departmentId
        )
        .then(handleError)
        .then((data) => {
            let parent = document.getElementById(data.id);
            let parentContainer = parent.getElementsByClassName("container")[0];
            let sectionHeading = document.getElementById("dname");
            let sectionTitle = sectionHeading.cloneNode(true);
            sectionTitle.innerText = data.name;
            parentContainer.appendChild(sectionTitle);
            data.jobs.forEach((job) => {
                let listing = document.getElementById("listing");
                let ghListing = listing.cloneNode(true);
                ghListing.setAttribute("data-updated-at", job.updated_at);
                ghListing.id = job.id;
                let jobTitle = ghListing.getElementsByClassName("job-title")[0];
                jobTitle.innerText = job.title;
                ghListing.setAttribute("href", job.absolute_url);
                let jobLocation = ghListing.getElementsByClassName("job-location")[0];
                jobLocation.innerText = job.location.name;
                parentContainer.appendChild(ghListing);
            });
        })
        .catch(function writeError(err) {
            console.error(err);
        })
        .finally(() => {
            loading.classList.add("invisible");
            loading.remove();
            root.classList.add("visible");
        });
    });
}